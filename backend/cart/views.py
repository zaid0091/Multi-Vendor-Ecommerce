"""
cart/views.py
-------------
Cart management endpoints with hardened input validation.

OWASP A03 — Injection / unexpected input:
  • product_id is validated as a positive integer before any DB lookup.
  • quantity is validated as an integer within [1, 100] — a cart item
    quantity outside this range is almost certainly an error or attack.
  • Raw int() coercion removed; replaced by DRF serializer validation so
    a non-numeric value returns a clear 400 rather than a 500 ValueError.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, serializers as drf_serializers
from .models import Cart, CartItem
from .serializers import CartSerializer
from products.models import Product

# ---------------------------------------------------------------------------
# Inline input serializers — validates cart POST / PATCH bodies before
# any business logic runs (OWASP A03 schema-based validation).
# ---------------------------------------------------------------------------
QUANTITY_MAX = 100   # Reasonable per-item cart cap


class _AddToCartSerializer(drf_serializers.Serializer):
    """Validates the body of POST /api/cart/ (add / update item)."""
    product_id = drf_serializers.IntegerField(min_value=1)
    quantity = drf_serializers.IntegerField(
        min_value=1,
        max_value=QUANTITY_MAX,
        default=1,
        error_messages={
            'min_value': 'Quantity must be at least 1.',
            'max_value': f'Quantity cannot exceed {QUANTITY_MAX} per item.',
        },
    )


class _UpdateCartItemSerializer(drf_serializers.Serializer):
    """Validates the body of PATCH /api/cart/items/<id>/."""
    quantity = drf_serializers.IntegerField(
        min_value=0,            # 0 means "remove the item"
        max_value=QUANTITY_MAX,
        error_messages={
            'max_value': f'Quantity cannot exceed {QUANTITY_MAX} per item.',
        },
    )


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def get(self, request):
        cart = self._get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        """Add or update item in cart."""
        # Validate input before touching the database
        input_serializer = _AddToCartSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_id = input_serializer.validated_data['product_id']
        quantity = input_serializer.validated_data['quantity']

        cart = self._get_or_create_cart(request.user)

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Stock check
        if quantity > product.stock:
            return Response(
                {'error': f'Only {product.stock} items available in stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        cart_item.quantity = quantity
        cart_item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        """Clear entire cart."""
        cart = self._get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared.'})


class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        # Validate input before any DB access
        input_serializer = _UpdateCartItemSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        quantity = input_serializer.validated_data['quantity']

        try:
            item = CartItem.objects.select_related('product', 'cart').get(
                pk=item_id, cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quantity == 0:
            # Treat quantity=0 as a delete request
            item.delete()
            return Response({'message': 'Item removed from cart.'})

        if quantity > item.product.stock:
            return Response(
                {'error': f'Only {item.product.stock} in stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, item_id):
        try:
            item = CartItem.objects.get(pk=item_id, cart__user=request.user)
            cart = item.cart
            item.delete()
            return Response(CartSerializer(cart).data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)
