from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product-list'),
    path('reviews/recent/', views.RecentReviewListView.as_view(), name='reviews-recent'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<int:pk>/reviews/', views.ProductReviewListView.as_view(), name='product-reviews'),
    path('<int:pk>/reviews/<int:review_id>/', views.ProductReviewDetailView.as_view(), name='product-review-detail'),
    path('<int:pk>/faqs/', views.ProductFAQListView.as_view(), name='product-faqs'),
    path('<int:pk>/faqs/<int:faq_id>/', views.ProductFAQDetailView.as_view(), name='product-faq-detail'),
    path('<int:pk>/variants/', views.ProductVariantListView.as_view(), name='product-variants'),
    path('<int:pk>/variants/<int:variant_id>/', views.ProductVariantDetailView.as_view(), name='product-variant-detail'),
    path('<int:pk>/images/', views.ProductImageListView.as_view(), name='product-images'),
    path('<int:pk>/images/<int:image_id>/', views.ProductImageDetailView.as_view(), name='product-image-detail'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/create/', views.CategoryCreateView.as_view(), name='category-create'),
    path('seller/', views.SellerProductListView.as_view(), name='seller-products'),
    path('seller/<int:pk>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
]
