"""
products/serializers.py
"""
from decimal import Decimal
from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Product, Category, Review, FAQ, ProductVariant, ProductImage

PRODUCT_NAME_MAX_LEN = 300
PRODUCT_DESC_MAX_LEN = 5000
PRICE_MIN = Decimal('0.01')
PRICE_MAX = Decimal('999999.99')
STOCK_MAX = 1_000_000
IMAGE_MAX_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
CATEGORY_NAME_MAX_LEN = 100
CATEGORY_DESC_MAX_LEN = 500


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=CATEGORY_NAME_MAX_LEN, trim_whitespace=True)
    description = serializers.CharField(
        max_length=CATEGORY_DESC_MAX_LEN, trim_whitespace=True,
        required=False, allow_blank=True,
    )

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order']
        read_only_fields = ['id']

    def get_image(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'value', 'price_adjustment', 'final_price', 'stock', 'sku', 'is_active', 'order']
        read_only_fields = ['id', 'final_price']

    def get_final_price(self, obj):
        return float(obj.final_price)


class ProductVariantWriteSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    value = serializers.CharField(max_length=100, trim_whitespace=True)
    price_adjustment = serializers.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        min_value=Decimal('-9999.99'), max_value=Decimal('9999.99'),
    )
    stock = serializers.IntegerField(min_value=0, max_value=STOCK_MAX)
    sku = serializers.CharField(max_length=100, required=False, allow_blank=True)
    order = serializers.IntegerField(min_value=0, required=False, default=0)

    class Meta:
        model = ProductVariant
        fields = ['name', 'value', 'price_adjustment', 'stock', 'sku', 'is_active', 'order']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    seller_store_name = serializers.CharField(source='seller.store_name', read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    image = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'compare_at_price',
            'is_on_sale', 'discount_percentage',
            'stock', 'image', 'is_active', 'category', 'category_name',
            'seller_id', 'seller_store_name', 'created_at',
            'avg_rating', 'review_count', 'variants', 'images',
        ]
        read_only_fields = ['id', 'created_at', 'seller_id', 'seller_store_name']

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_avg_rating(self, obj):
        # Use prefetched annotation if available, otherwise query
        if hasattr(obj, '_avg_rating'):
            val = obj._avg_rating
        else:
            val = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(val), 1) if val is not None else None

    def get_review_count(self, obj):
        if hasattr(obj, '_review_count'):
            return obj._review_count
        return obj.reviews.count()


class ProductCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=PRODUCT_NAME_MAX_LEN, trim_whitespace=True)
    description = serializers.CharField(
        max_length=PRODUCT_DESC_MAX_LEN, trim_whitespace=True,
        required=False, allow_blank=True,
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=PRICE_MIN, max_value=PRICE_MAX,
    )
    compare_at_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=PRICE_MIN,
        max_value=PRICE_MAX, required=False, allow_null=True,
    )
    stock = serializers.IntegerField(min_value=0, max_value=STOCK_MAX)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'compare_at_price', 'stock', 'image', 'category', 'is_active']

    def validate(self, data):
        compare = data.get('compare_at_price')
        price = data.get('price')
        if compare and price and compare <= price:
            raise serializers.ValidationError(
                'Compare-at price must be greater than the selling price.'
            )
        return data

    def validate_image(self, image):
        if image is None:
            return image
        if image.size > IMAGE_MAX_BYTES:
            raise serializers.ValidationError(
                f'Image file too large. Maximum allowed size is {IMAGE_MAX_BYTES // (1024 * 1024)} MB.'
            )
        content_type = getattr(image, 'content_type', '')
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                'Unsupported image format. Please upload a JPEG, PNG, WebP, or GIF.'
            )
        return image


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class FAQWriteSerializer(serializers.ModelSerializer):
    question = serializers.CharField(max_length=500, trim_whitespace=True)
    answer = serializers.CharField(max_length=3000, trim_whitespace=True)
    order = serializers.IntegerField(min_value=0, required=False, default=0)

    class Meta:
        model = FAQ
        fields = ['question', 'answer', 'order']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_id', 'user_name', 'rating', 'title', 'body', 'created_at']
        read_only_fields = ['id', 'user_id', 'user_name', 'created_at']

    def get_user_name(self, obj):
        name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return name if name else obj.user.email.split('@')[0]


class ReviewCreateSerializer(serializers.ModelSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=150, required=False, allow_blank=True)
    body = serializers.CharField(max_length=2000, trim_whitespace=True)

    class Meta:
        model = Review
        fields = ['rating', 'title', 'body']
