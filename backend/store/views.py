from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import SellerProfile
from .serializers import SellerProfileSerializer, SellerProfileCreateSerializer
from users.permissions import IsSeller, IsSellerOrAdmin


class SellerStoreView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        try:
            profile = request.user.seller_profile
            serializer = SellerProfileSerializer(profile)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if hasattr(request.user, 'seller_profile'):
            return Response({'error': 'Store already exists'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SellerProfileCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        try:
            profile = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SellerProfileCreateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(SellerProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicStoreListView(APIView):
    permission_classes = []

    def get(self, request):
        stores = SellerProfile.objects.filter(status='approved').select_related('user')
        serializer = SellerProfileSerializer(stores, many=True)
        return Response(serializer.data)


class PublicStoreDetailView(APIView):
    permission_classes = []

    def get(self, request, pk):
        try:
            store = SellerProfile.objects.get(pk=pk, status='approved')
            serializer = SellerProfileSerializer(store)
            return Response(serializer.data)
        except SellerProfile.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)


class SellerAnalyticsView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        from orders.models import SellerOrder, OrderItem
        from products.models import Product

        try:
            seller = request.user.seller_profile
        except SellerProfile.DoesNotExist:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)

        paid_seller_orders = SellerOrder.objects.filter(
            seller=seller, order__payment_status='paid'
        )

        total_sales = paid_seller_orders.aggregate(total=Sum('subtotal'))['total'] or 0
        total_orders = paid_seller_orders.count()
        commission = float(total_sales) * 0.10
        net_earnings = float(total_sales) - commission

        # Monthly revenue (last 6 months)
        monthly_data = []
        for i in range(5, -1, -1):
            month_start = (timezone.now().replace(day=1) - timedelta(days=30 * i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            month_revenue = paid_seller_orders.filter(
                order__created_at__gte=month_start,
                order__created_at__lt=month_end
            ).aggregate(total=Sum('subtotal'))['total'] or 0
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'revenue': float(month_revenue),
            })

        # Best selling products
        best_selling = OrderItem.objects.filter(
            seller_order__seller=seller,
            seller_order__order__payment_status='paid'
        ).values(
            'product__id', 'product__name'
        ).annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('price')
        ).order_by('-total_sold')[:5]

        # Order status distribution
        status_dist = paid_seller_orders.values('status').annotate(count=Count('id'))

        return Response({
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'commission': commission,
            'net_earnings': net_earnings,
            'monthly_revenue': monthly_data,
            'best_selling_products': list(best_selling),
            'order_status_distribution': list(status_dist),
        })
