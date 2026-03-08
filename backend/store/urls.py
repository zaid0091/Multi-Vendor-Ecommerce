from django.urls import path
from . import views

urlpatterns = [
    path('store/', views.SellerStoreView.as_view(), name='seller-store'),
    path('analytics/', views.SellerAnalyticsView.as_view(), name='seller-analytics'),
    path('stores/', views.PublicStoreListView.as_view(), name='public-stores'),
    path('stores/<int:pk>/', views.PublicStoreDetailView.as_view(), name='public-store-detail'),
]
