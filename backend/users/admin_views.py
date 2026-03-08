from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from .models import User
from .permissions import IsAdmin


class AdminSellerListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from store.models import SellerProfile
        from store.serializers import SellerProfileSerializer
        status_filter = request.query_params.get('status', None)
        sellers = SellerProfile.objects.select_related('user').all()
        if status_filter:
            sellers = sellers.filter(status=status_filter)
        serializer = SellerProfileSerializer(sellers, many=True)
        return Response(serializer.data)


class ApproveSeller(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        from store.models import SellerProfile
        try:
            seller = SellerProfile.objects.get(pk=pk)
            seller.status = 'approved'
            seller.save()
            return Response({'message': 'Seller approved'})
        except SellerProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class SuspendSeller(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        from store.models import SellerProfile
        try:
            seller = SellerProfile.objects.get(pk=pk)
            seller.status = 'suspended'
            seller.save()
            return Response({'message': 'Seller suspended'})
        except SellerProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class PlatformStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from orders.models import Order, SellerOrder
        from products.models import Product
        from store.models import SellerProfile
        total_revenue = Order.objects.filter(
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        total_commission = float(total_revenue) * 0.10
        stats = {
            'total_users': User.objects.filter(role='customer').count(),
            'total_sellers': SellerProfile.objects.count(),
            'approved_sellers': SellerProfile.objects.filter(status='approved').count(),
            'pending_sellers': SellerProfile.objects.filter(status='pending').count(),
            'total_products': Product.objects.count(),
            'total_orders': Order.objects.count(),
            'paid_orders': Order.objects.filter(payment_status='paid').count(),
            'total_revenue': float(total_revenue),
            'total_commission': total_commission,
        }
        return Response(stats)


class AdminOrderListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from orders.models import Order
        from orders.serializers import OrderSerializer
        orders = Order.objects.select_related('user').prefetch_related(
            'seller_orders__items__product'
        ).order_by('-created_at')[:50]
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class CommissionOverviewView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from store.models import SellerProfile
        from orders.models import SellerOrder
        sellers = SellerProfile.objects.filter(status='approved')
        result = []
        for seller in sellers:
            seller_orders = SellerOrder.objects.filter(
                seller=seller, order__payment_status='paid'
            )
            total_sales = seller_orders.aggregate(total=Sum('subtotal'))['total'] or 0
            commission = float(total_sales) * 0.10
            result.append({
                'seller_id': seller.id,
                'store_name': seller.store_name,
                'total_sales': float(total_sales),
                'commission': commission,
                'net_earnings': float(total_sales) - commission,
            })
        return Response(result)
