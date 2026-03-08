from django.contrib import admin
from .models import Order, SellerOrder, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class SellerOrderInline(admin.TabularInline):
    model = SellerOrder
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_amount', 'payment_status', 'created_at']
    list_filter = ['payment_status']
    inlines = [SellerOrderInline]

@admin.register(SellerOrder)
class SellerOrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'seller', 'status', 'subtotal']
    list_filter = ['status']
    inlines = [OrderItemInline]
