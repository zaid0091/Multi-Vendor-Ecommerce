from django.db import models
from store.models import SellerProfile
from django.core.validators import MinValueValidator, MaxValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    seller = models.ForeignKey(SellerProfile, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=300)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Original / strike-through price for sale display'
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

    @property
    def is_on_sale(self):
        return bool(self.compare_at_price and self.compare_at_price > self.price)

    @property
    def discount_percentage(self):
        if not self.is_on_sale:
            return 0
        return round(((self.compare_at_price - self.price) / self.compare_at_price) * 100)


class ProductImage(models.Model):
    """Additional images for a product (beyond the primary `image` field)."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.product.name} — image {self.id}'


class ProductVariant(models.Model):
    """
    Represents a single selectable option for a product, e.g. Size=XL or Color=Red.
    Variants share the same product but can have their own price adjustment and stock.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100, help_text='Option name, e.g. "Size" or "Color"')
    value = models.CharField(max_length=100, help_text='Option value, e.g. "XL" or "Red"')
    price_adjustment = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text='Added to the base product price. Use negative values for discounted variants.'
    )
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'product_variants'
        ordering = ['name', 'order', 'value']
        unique_together = ('product', 'name', 'value')

    def __str__(self):
        return f'{self.product.name} — {self.name}: {self.value}'

    @property
    def final_price(self):
        return self.product.price + self.price_adjustment


class FAQ(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='faqs')
    question = models.CharField(max_length=500)
    answer = models.TextField(max_length=3000)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_faqs'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.product.name} \u2014 {self.question[:60]}'


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=150, blank=True)
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_reviews'
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.product.name} ({self.rating})'
