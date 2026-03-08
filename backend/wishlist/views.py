from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import WishlistItem
from .serializers import WishlistItemSerializer
from products.models import Product


class WishlistView(APIView):
    """
    GET  /api/wishlist/         — list authenticated user's wishlist
    POST /api/wishlist/         — add a product { "product_id": <int> }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related(
            'product__category', 'product__seller'
        )
        serializer = WishlistItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            return Response({'detail': 'Already in wishlist.'}, status=status.HTTP_200_OK)

        serializer = WishlistItemSerializer(item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WishlistItemView(APIView):
    """
    DELETE /api/wishlist/<product_id>/  — remove a product from wishlist
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        deleted, _ = WishlistItem.objects.filter(
            user=request.user, product_id=product_id
        ).delete()
        if not deleted:
            return Response({'error': 'Item not in wishlist.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistStatusView(APIView):
    """
    GET /api/wishlist/status/?ids=1,2,3
    Returns a dict mapping product_id -> bool for the given product ids.
    Used by the frontend to bulk-check wishlist state on product list pages.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ids_param = request.query_params.get('ids', '')
        try:
            product_ids = [int(i) for i in ids_param.split(',') if i.strip()]
        except ValueError:
            return Response({'error': 'Invalid ids parameter.'}, status=status.HTTP_400_BAD_REQUEST)

        if not product_ids:
            return Response({})

        wishlisted = set(
            WishlistItem.objects.filter(
                user=request.user, product_id__in=product_ids
            ).values_list('product_id', flat=True)
        )
        return Response({str(pid): pid in wishlisted for pid in product_ids})
