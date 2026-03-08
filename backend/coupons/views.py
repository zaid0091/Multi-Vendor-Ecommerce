from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from users.permissions import IsSeller
from .models import Coupon
from .serializers import CouponSerializer, ApplyCouponSerializer


class SellerCouponListCreateView(APIView):
    """GET all coupons for the logged-in seller; POST to create a new one."""
    permission_classes = [IsSeller]

    def get(self, request):
        seller = request.user.seller_profile
        coupons = Coupon.objects.filter(seller=seller).order_by('-created_at')
        return Response(CouponSerializer(coupons, many=True).data)

    def post(self, request):
        seller = request.user.seller_profile
        serializer = CouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        if Coupon.objects.filter(seller=seller, code=code).exists():
            return Response(
                {'error': f'You already have a coupon with code "{code}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        coupon = serializer.save(seller=seller)
        return Response(CouponSerializer(coupon).data, status=status.HTTP_201_CREATED)


class SellerCouponDetailView(APIView):
    """PATCH to update; DELETE to remove a seller's own coupon."""
    permission_classes = [IsSeller]

    def _get_coupon(self, request, pk):
        try:
            return Coupon.objects.get(pk=pk, seller=request.user.seller_profile)
        except Coupon.DoesNotExist:
            return None

    def patch(self, request, pk):
        coupon = self._get_coupon(request, pk)
        if not coupon:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        coupon = self._get_coupon(request, pk)
        if not coupon:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        coupon.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApplyCouponView(APIView):
    """
    Public endpoint — validate a coupon code and return the discount amount.
    No authentication required so guest carts can validate too.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        order_total = serializer.validated_data['order_total']

        try:
            coupon = Coupon.objects.get(code=code, is_active=True)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_valid:
            if coupon.expires_at and coupon.expires_at < timezone.now():
                return Response({'error': 'This coupon has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
                return Response({'error': 'This coupon has reached its usage limit.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'This coupon is no longer valid.'}, status=status.HTTP_400_BAD_REQUEST)

        if float(order_total) < float(coupon.min_order_amount):
            return Response(
                {'error': f'Minimum order of ${coupon.min_order_amount} required for this coupon.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount = coupon.calculate_discount(order_total)
        return Response({
            'coupon_id': coupon.id,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': float(coupon.discount_value),
            'discount_amount': discount,
            'new_total': round(float(order_total) - discount, 2),
        })
