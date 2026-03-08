from rest_framework import serializers
from django.utils import timezone
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()
    is_expired = serializers.SerializerMethodField()
    uses_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'min_order_amount', 'max_uses', 'used_count',
            'is_active', 'expires_at', 'created_at',
            'is_valid', 'is_expired', 'uses_remaining',
        ]
        read_only_fields = ['id', 'used_count', 'created_at']

    def get_is_expired(self, obj):
        return bool(obj.expires_at and obj.expires_at < timezone.now())

    def get_uses_remaining(self, obj):
        if obj.max_uses is None:
            return None
        return max(0, obj.max_uses - obj.used_count)

    def validate_code(self, value):
        return value.strip().upper()

    def validate_discount_value(self, value):
        if value <= 0:
            raise serializers.ValidationError('Discount value must be greater than 0.')
        return value

    def validate(self, data):
        if data.get('discount_type') == 'percentage' and data.get('discount_value', 0) > 100:
            raise serializers.ValidationError({'discount_value': 'Percentage discount cannot exceed 100.'})
        return data


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, trim_whitespace=True)
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_code(self, value):
        return value.strip().upper()
