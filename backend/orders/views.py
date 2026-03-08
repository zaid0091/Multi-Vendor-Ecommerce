from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import transaction
from django.conf import settings
from .models import Order, SellerOrder, OrderItem
from .serializers import OrderSerializer, SellerOrderSerializer, CheckoutSerializer, PaymentIntentSerializer
from cart.models import Cart
from users.permissions import IsSeller
from coupons.models import Coupon
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY


# ---------------------------------------------------------------------------
# Helper — shared coupon resolution (avoids duplication)
# ---------------------------------------------------------------------------
def _resolve_coupon(coupon_id, cart_total):
    """Return (coupon_or_None, discount_amount_float)."""
    if not coupon_id:
        return None, 0
    try:
        coupon = Coupon.objects.get(pk=coupon_id, is_active=True)
        if coupon.is_valid:
            return coupon, float(coupon.calculate_discount(cart_total))
    except Coupon.DoesNotExist:
        pass
    return None, 0


# ---------------------------------------------------------------------------
# REAL Stripe checkout — step 1: create PaymentIntent
# ---------------------------------------------------------------------------
class CreatePaymentIntentView(APIView):
    """
    POST /api/orders/create-payment-intent/
    Validates cart + address, calculates total, creates a Stripe PaymentIntent
    and returns the client_secret so the frontend can confirm payment.
    No order record is written yet.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentIntentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        for item in cart.items.all():
            if item.quantity > item.product.stock:
                return Response(
                    {'error': f'Insufficient stock for {item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_total = sum(item.subtotal for item in cart.items.all())
        coupon, discount_amount = _resolve_coupon(
            serializer.validated_data.get('coupon_id'), cart_total
        )
        total_amount = max(0.0, float(cart_total) - discount_amount)
        amount_cents = int(round(total_amount * 100))

        if amount_cents < 50:
            return Response(
                {'error': 'Order total is too low to process (minimum $0.50).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                automatic_payment_methods={'enabled': True},
                metadata={
                    'user_id': str(request.user.id),
                    'coupon_id': str(coupon.id) if coupon else '',
                    'shipping_address': serializer.validated_data['shipping_address'],
                },
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': getattr(e, 'user_message', str(e))},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': total_amount,
        })


# ---------------------------------------------------------------------------
# REAL Stripe checkout — step 2: confirm order after payment succeeds
# ---------------------------------------------------------------------------
class ConfirmOrderView(APIView):
    """
    POST /api/orders/confirm/
    Called by the frontend after stripe.confirmPayment() resolves successfully.
    Verifies the PaymentIntent server-side, then atomically creates the order.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        payment_intent_id = request.data.get('payment_intent_id', '').strip()
        shipping_address = request.data.get('shipping_address', '').strip()
        coupon_id = request.data.get('coupon_id')

        if not payment_intent_id:
            return Response({'error': 'payment_intent_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not shipping_address:
            return Response({'error': 'shipping_address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(shipping_address) > 500:
            return Response({'error': 'Shipping address too long.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Server-side verification (never trust the client) ---
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            return Response(
                {'error': getattr(e, 'user_message', str(e))},
                status=status.HTTP_400_BAD_REQUEST
            )

        if intent.status != 'succeeded':
            return Response(
                {'error': f'Payment not completed (status: {intent.status}).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Idempotency: return existing order if already created ---
        existing = Order.objects.filter(payment_intent_id=payment_intent_id).first()
        if existing:
            return Response(OrderSerializer(existing).data, status=status.HTTP_200_OK)

        try:
            cart = Cart.objects.prefetch_related('items__product__seller').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        for item in cart.items.all():
            if item.quantity > item.product.stock:
                return Response(
                    {'error': f'Insufficient stock for {item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_total = sum(item.subtotal for item in cart.items.all())
        coupon, discount_amount = _resolve_coupon(coupon_id, cart_total)
        total_amount = max(0.0, float(cart_total) - discount_amount)

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            discount_amount=discount_amount,
            coupon_code=coupon.code if coupon else '',
            payment_status='paid',
            payment_intent_id=payment_intent_id,
            shipping_address=shipping_address,
        )

        if coupon:
            Coupon.objects.filter(pk=coupon.pk).update(used_count=coupon.used_count + 1)

        # Group cart items by seller
        seller_map = {}
        for item in cart.items.select_related('product__seller').all():
            sid = item.product.seller.id
            if sid not in seller_map:
                seller_map[sid] = {'seller': item.product.seller, 'items': []}
            seller_map[sid]['items'].append(item)

        for data in seller_map.values():
            seller_subtotal = sum(i.subtotal for i in data['items'])
            seller_order = SellerOrder.objects.create(
                order=order,
                seller=data['seller'],
                subtotal=seller_subtotal,
                status='processing',
            )
            for item in data['items']:
                OrderItem.objects.create(
                    seller_order=seller_order,
                    product=item.product,
                    product_name=item.product.name,
                    quantity=item.quantity,
                    price=item.product.price,
                )
                item.product.stock -= item.quantity
                item.product.save()

        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Legacy mock checkout (kept for backwards compatibility / testing)
# ---------------------------------------------------------------------------
class CheckoutView(APIView):
    """Create order from cart (mocked payment — no real Stripe call)"""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.prefetch_related('items__product__seller').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        for item in cart.items.all():
            if item.quantity > item.product.stock:
                return Response(
                    {'error': f'Insufficient stock for {item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_total = sum(item.subtotal for item in cart.items.all())
        coupon, discount_amount = _resolve_coupon(
            serializer.validated_data.get('coupon_id'), cart_total
        )
        total_amount = max(0.0, float(cart_total) - discount_amount)

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            discount_amount=discount_amount,
            coupon_code=coupon.code if coupon else '',
            payment_status='paid',
            shipping_address=serializer.validated_data['shipping_address'],
        )

        if coupon:
            Coupon.objects.filter(pk=coupon.pk).update(used_count=coupon.used_count + 1)

        seller_map = {}
        for item in cart.items.select_related('product__seller').all():
            sid = item.product.seller.id
            if sid not in seller_map:
                seller_map[sid] = {'seller': item.product.seller, 'items': []}
            seller_map[sid]['items'].append(item)

        for data in seller_map.values():
            seller_subtotal = sum(i.subtotal for i in data['items'])
            seller_order = SellerOrder.objects.create(
                order=order,
                seller=data['seller'],
                subtotal=seller_subtotal,
                status='processing',
            )
            for item in data['items']:
                OrderItem.objects.create(
                    seller_order=seller_order,
                    product=item.product,
                    product_name=item.product.name,
                    quantity=item.quantity,
                    price=item.product.price,
                )
                item.product.stock -= item.quantity
                item.product.save()

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Orders — customer views
# ---------------------------------------------------------------------------
class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related(
            'seller_orders__items__product'
        )
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related(
                'seller_orders__items__product'
            ).get(pk=pk, user=request.user)
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


class CancelOrderView(APIView):
    """Customer cancels their own order (only if all items are still pending/processing)."""
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related(
                'seller_orders__items__product'
            ).get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        cancellable_statuses = {'pending', 'processing'}
        for so in order.seller_orders.all():
            if so.status not in cancellable_statuses:
                return Response(
                    {'error': f'Order cannot be cancelled — items already {so.status}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        for so in order.seller_orders.all():
            for item in so.items.all():
                if item.product:
                    item.product.stock += item.quantity
                    item.product.save()
            so.status = 'cancelled'
            so.save()

        order.payment_status = 'refunded'
        order.save()

        return Response(OrderSerializer(order).data)


# ---------------------------------------------------------------------------
# Orders — seller views
# ---------------------------------------------------------------------------
class SellerOrderListView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        try:
            seller = request.user.seller_profile
        except Exception:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)
        seller_orders = SellerOrder.objects.filter(seller=seller).select_related('order').prefetch_related('items__product')
        serializer = SellerOrderSerializer(seller_orders, many=True)
        return Response(serializer.data)


class SellerOrderUpdateView(APIView):
    permission_classes = [IsSeller]

    def patch(self, request, pk):
        try:
            seller = request.user.seller_profile
            seller_order = SellerOrder.objects.get(pk=pk, seller=seller)
        except SellerOrder.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        seller_order.status = new_status
        seller_order.save()
        return Response(SellerOrderSerializer(seller_order).data)
