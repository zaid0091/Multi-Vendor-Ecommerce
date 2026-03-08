"""
orders/serializers.py
----------------------
Input validation for checkout and order responses.

OWASP A03:
  • shipping_address: length-limited and whitespace-trimmed to prevent
    oversized string injection into the database.
  • CheckoutSerializer validates all user-supplied fields before the
    atomic transaction block in CheckoutView runs.
"""

from rest_framework import serializers
from .models import Order, SellerOrder, OrderItem

SHIPPING_ADDRESS_MAX_LEN = 500


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'subtotal']

    def get_subtotal(self, obj):
        return float(obj.subtotal)


class SellerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)

    class Meta:
        model = SellerOrder
        fields = ['id', 'seller', 'seller_name', 'status', 'subtotal', 'items', 'created_at']
        read_only_fields = ['id', 'seller', 'seller_name', 'subtotal', 'items', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    seller_orders = SellerOrderSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(source='user.email', read_only=True)
    customer_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_email', 'customer_name', 'total_amount',
            'discount_amount', 'coupon_code',
            'payment_status', 'shipping_address', 'seller_orders', 'created_at',
        ]
        read_only_fields = [
            'id', 'customer_email', 'customer_name', 'total_amount',
            'discount_amount', 'coupon_code',
            'payment_status', 'seller_orders', 'created_at',
        ]


class CheckoutSerializer(serializers.Serializer):
    """
    Validates checkout request body.
    Only explicitly declared fields are accepted — any other fields are ignored,
    preventing mass-assignment into Order.objects.create().
    """
    shipping_address = serializers.CharField(
        required=True,
        max_length=SHIPPING_ADDRESS_MAX_LEN,
        trim_whitespace=True,
        error_messages={
            'required': 'A shipping address is required to complete checkout.',
            'max_length': f'Shipping address must be at most {SHIPPING_ADDRESS_MAX_LEN} characters.',
            'blank': 'Shipping address cannot be blank.',
        },
    )
    coupon_id = serializers.IntegerField(required=False, allow_null=True)


class PaymentIntentSerializer(serializers.Serializer):
    """Validates the create-payment-intent request (step 1 of real Stripe checkout)."""
    shipping_address = serializers.CharField(
        required=True,
        max_length=SHIPPING_ADDRESS_MAX_LEN,
        trim_whitespace=True,
        error_messages={
            'required': 'A shipping address is required.',
            'max_length': f'Shipping address must be at most {SHIPPING_ADDRESS_MAX_LEN} characters.',
            'blank': 'Shipping address cannot be blank.',
        },
    )
    coupon_id = serializers.IntegerField(required=False, allow_null=True)
