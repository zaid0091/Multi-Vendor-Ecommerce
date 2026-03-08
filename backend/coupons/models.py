from django.db import models
from django.utils import timezone
from store.models import SellerProfile


class Coupon(models.Model):
    DISCOUNT_TYPE = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]

    seller = models.ForeignKey(
        SellerProfile, on_delete=models.CASCADE, related_name='coupons'
    )
    code = models.CharField(max_length=50)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE, default='percentage')
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    min_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Minimum cart total required to use this coupon'
    )
    max_uses = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Leave blank for unlimited uses'
    )
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'coupons'
        # Coupon codes are unique per seller
        unique_together = ('seller', 'code')

    def __str__(self):
        return f'{self.code} ({self.seller.store_name})'

    @property
    def is_valid(self):
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, order_total):
        """Return the discount amount for a given order total."""
        if not self.is_valid:
            return 0
        if order_total < self.min_order_amount:
            return 0
        if self.discount_type == 'percentage':
            return round(float(order_total) * float(self.discount_value) / 100, 2)
        return min(float(self.discount_value), float(order_total))
