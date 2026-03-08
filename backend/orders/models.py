from django.db import models
from users.models import User
from store.models import SellerProfile
from products.models import Product


class Order(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=50, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_intent_id = models.CharField(max_length=200, blank=True)
    shipping_address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.id} by {self.user.email}'


class SellerOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='seller_orders')
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='seller_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seller_orders'

    def __str__(self):
        return f'SellerOrder #{self.id} for Order #{self.order.id}'


class OrderItem(models.Model):
    seller_order = models.ForeignKey(SellerOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=300)  # snapshot
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # price at time of purchase

    class Meta:
        db_table = 'order_items'

    @property
    def subtotal(self):
        return self.price * self.quantity
