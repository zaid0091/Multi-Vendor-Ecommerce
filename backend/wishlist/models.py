from django.db import models
from users.models import User
from products.models import Product


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist_items'
        unique_together = ('user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f'{self.user.email} \u2192 {self.product.name}'
