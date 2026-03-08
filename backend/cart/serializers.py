from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_name', 'product_price', 'product_image', 'quantity', 'subtotal']

    def get_subtotal(self, obj):
        return float(obj.subtotal)

    def get_product_image(self, obj):
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'updated_at']

    def get_total(self, obj):
        return float(obj.total)

    def get_item_count(self, obj):
        return obj.items.count()
