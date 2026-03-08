from django.urls import path
from . import views

urlpatterns = [
    path('create-payment-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm/', views.ConfirmOrderView.as_view(), name='confirm-order'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    path('', views.OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', views.CancelOrderView.as_view(), name='order-cancel'),
    path('seller/', views.SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/<int:pk>/status/', views.SellerOrderUpdateView.as_view(), name='seller-order-update'),
]
