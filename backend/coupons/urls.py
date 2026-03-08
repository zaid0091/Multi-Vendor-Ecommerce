from django.urls import path
from . import views

urlpatterns = [
    path('', views.SellerCouponListCreateView.as_view(), name='coupon-list-create'),
    path('<int:pk>/', views.SellerCouponDetailView.as_view(), name='coupon-detail'),
    path('apply/', views.ApplyCouponView.as_view(), name='coupon-apply'),
]
