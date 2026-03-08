from django.db import models
from users.models import User


class SellerProfile(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    store_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='store_logos/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seller_profiles'

    def __str__(self):
        return f'{self.store_name} ({self.status})'
