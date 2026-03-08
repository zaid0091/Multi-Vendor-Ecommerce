from django.urls import path
from . import admin_views

urlpatterns = [
    path('sellers/', admin_views.AdminSellerListView.as_view(), name='admin-sellers'),
    path('sellers/<int:pk>/approve/', admin_views.ApproveSeller.as_view(), name='admin-approve-seller'),
    path('sellers/<int:pk>/suspend/', admin_views.SuspendSeller.as_view(), name='admin-suspend-seller'),
    path('stats/', admin_views.PlatformStatsView.as_view(), name='admin-stats'),
    path('orders/', admin_views.AdminOrderListView.as_view(), name='admin-orders'),
    path('commission/', admin_views.CommissionOverviewView.as_view(), name='admin-commission'),
]
