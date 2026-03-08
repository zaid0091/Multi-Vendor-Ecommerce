from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count
import django_filters
from .models import Product, Category, FAQ, ProductVariant, ProductImage
from .serializers import (
    ProductSerializer, ProductCreateSerializer, CategorySerializer,
    ReviewSerializer, ReviewCreateSerializer,
    FAQSerializer, FAQWriteSerializer,
    ProductVariantSerializer, ProductVariantWriteSerializer,
    ProductImageSerializer,
)
from users.permissions import IsSeller, IsAdmin


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.NumberFilter(field_name='category__id')
    seller = django_filters.NumberFilter(field_name='seller__id')
    on_sale = django_filters.BooleanFilter(method='filter_on_sale')

    def filter_on_sale(self, queryset, name, value):
        if value:
            from django.db.models import Q, F
            return queryset.filter(compare_at_price__isnull=False).filter(
                compare_at_price__gt=F('price')
            )
        return queryset

    class Meta:
        model = Product
        fields = ['category', 'seller', 'min_price', 'max_price', 'on_sale']


class ProductListView(generics.ListAPIView):
    """Public product listing with search, filter, sort, pagination"""
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name', 'avg_rating']
    ordering = ['-created_at']
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            seller__status='approved'
        ).select_related('category', 'seller').prefetch_related('variants', 'images').annotate(
            _avg_rating=Avg('reviews__rating'),
            _review_count=Count('reviews'),
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.select_related('category', 'seller').prefetch_related(
                'variants', 'images'
            ).annotate(
                _avg_rating=Avg('reviews__rating'),
                _review_count=Count('reviews'),
            ).get(pk=pk, is_active=True)
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class CategoryCreateView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Seller product CRUD
# ---------------------------------------------------------------------------
class SellerProductListView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        try:
            seller = request.user.seller_profile
        except Exception:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)
        products = Product.objects.filter(seller=seller).select_related('category').prefetch_related(
            'variants'
        ).annotate(
            _avg_rating=Avg('reviews__rating'),
            _review_count=Count('reviews'),
        )
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        try:
            seller = request.user.seller_profile
        except Exception:
            return Response({'error': 'No store found'}, status=status.HTTP_404_NOT_FOUND)
        if seller.status != 'approved':
            return Response({'error': 'Store must be approved to add products'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(seller=seller)
            return Response(
                ProductSerializer(serializer.instance, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerProductDetailView(APIView):
    permission_classes = [IsSeller]

    def _get_product(self, request, pk):
        try:
            seller = request.user.seller_profile
            return Product.objects.get(pk=pk, seller=seller)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product, context={'request': request}).data)

    def patch(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCreateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Variants
# ---------------------------------------------------------------------------
class ProductVariantListView(APIView):
    """
    GET  /products/<pk>/variants/  — public
    POST /products/<pk>/variants/  — seller only
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsSeller()]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        variants = product.variants.filter(is_active=True)
        return Response(ProductVariantSerializer(variants, many=True).data)

    def post(self, request, pk):
        try:
            seller = request.user.seller_profile
            product = Product.objects.get(pk=pk, seller=seller)
        except (Product.DoesNotExist, Exception):
            return Response({'error': 'Product not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVariantWriteSerializer(data=request.data)
        if serializer.is_valid():
            variant = serializer.save(product=product)
            return Response(ProductVariantSerializer(variant).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductVariantDetailView(APIView):
    """PATCH / DELETE seller's variant"""
    permission_classes = [IsSeller]

    def _get_variant(self, request, pk, variant_id):
        try:
            seller = request.user.seller_profile
            return ProductVariant.objects.get(pk=variant_id, product_id=pk, product__seller=seller)
        except ProductVariant.DoesNotExist:
            return None

    def patch(self, request, pk, variant_id):
        variant = self._get_variant(request, pk, variant_id)
        if not variant:
            return Response({'error': 'Variant not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVariantWriteSerializer(variant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductVariantSerializer(variant).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, variant_id):
        variant = self._get_variant(request, pk, variant_id)
        if not variant:
            return Response({'error': 'Variant not found'}, status=status.HTTP_404_NOT_FOUND)
        variant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class ProductReviewListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        reviews = product.reviews.select_related('user').all()
        serializer = ReviewSerializer(reviews, many=True)
        avg = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        return Response({'reviews': serializer.data, 'average_rating': round(avg, 1), 'count': len(reviews)})

    def post(self, request, pk):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        from .models import Review
        if Review.objects.filter(product=product, user=request.user).exists():
            return Response({'error': 'You have already reviewed this product'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(product=product, user=request.user)
            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductReviewDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, review_id):
        from .models import Review
        try:
            review = Review.objects.get(pk=review_id, product_id=pk, user=request.user)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Product Images (gallery)
# ---------------------------------------------------------------------------
class ProductImageListView(APIView):
    """
    GET  /products/<pk>/images/  — public
    POST /products/<pk>/images/  — seller only, multipart/form-data
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsSeller()]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        images = product.images.all()
        return Response(ProductImageSerializer(images, many=True, context={'request': request}).data)

    def post(self, request, pk):
        try:
            seller = request.user.seller_profile
            product = Product.objects.get(pk=pk, seller=seller)
        except (Product.DoesNotExist, Exception):
            return Response({'error': 'Product not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'image file is required'}, status=status.HTTP_400_BAD_REQUEST)
        # Validate size & type
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Image too large (max 5 MB)'}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(image_file, 'content_type', '') not in {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}:
            return Response({'error': 'Unsupported image format'}, status=status.HTTP_400_BAD_REQUEST)
        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            alt_text=request.data.get('alt_text', ''),
            order=int(request.data.get('order', 0)),
        )
        return Response(ProductImageSerializer(img, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ProductImageDetailView(APIView):
    """DELETE /products/<pk>/images/<image_id>/  — seller only"""
    permission_classes = [IsSeller]

    def delete(self, request, pk, image_id):
        try:
            seller = request.user.seller_profile
            img = ProductImage.objects.get(pk=image_id, product_id=pk, product__seller=seller)
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
        img.image.delete(save=False)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Recent reviews across all products (public, used on homepage)
# ---------------------------------------------------------------------------
class RecentReviewListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import Review
        limit = min(int(request.query_params.get('limit', 6)), 20)
        reviews = (
            Review.objects
            .select_related('user', 'product')
            .order_by('-created_at')[:limit]
        )
        data = []
        for r in reviews:
            name = f'{r.user.first_name} {r.user.last_name}'.strip()
            if not name:
                name = r.user.email.split('@')[0]
            data.append({
                'id': r.id,
                'user_name': name,
                'rating': r.rating,
                'title': r.title,
                'body': r.body,
                'product_id': r.product_id,
                'product_name': r.product.name,
                'created_at': r.created_at,
            })
        return Response(data)


# ---------------------------------------------------------------------------
# FAQs
# ---------------------------------------------------------------------------
class ProductFAQListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsSeller()]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        faqs = product.faqs.all()
        return Response(FAQSerializer(faqs, many=True).data)

    def post(self, request, pk):
        try:
            seller = request.user.seller_profile
            product = Product.objects.get(pk=pk, seller=seller)
        except (Product.DoesNotExist, Exception):
            return Response({'error': 'Product not found or not yours'}, status=status.HTTP_404_NOT_FOUND)
        serializer = FAQWriteSerializer(data=request.data)
        if serializer.is_valid():
            faq = serializer.save(product=product)
            return Response(FAQSerializer(faq).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductFAQDetailView(APIView):
    permission_classes = [IsSeller]

    def _get_faq(self, request, pk, faq_id):
        try:
            seller = request.user.seller_profile
            return FAQ.objects.get(pk=faq_id, product_id=pk, product__seller=seller)
        except FAQ.DoesNotExist:
            return None

    def patch(self, request, pk, faq_id):
        faq = self._get_faq(request, pk, faq_id)
        if not faq:
            return Response({'error': 'FAQ not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = FAQWriteSerializer(faq, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(FAQSerializer(faq).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, faq_id):
        faq = self._get_faq(request, pk, faq_id)
        if not faq:
            return Response({'error': 'FAQ not found'}, status=status.HTTP_404_NOT_FOUND)
        faq.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
