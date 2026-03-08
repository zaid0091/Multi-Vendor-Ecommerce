import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import sys
sys.path.insert(0, 'backend')
django.setup()

from users.models import User
from store.models import SellerProfile
from products.models import Category, Product

# Admin user
if not User.objects.filter(email='admin@test.com').exists():
    User.objects.create_superuser(
        email='admin@test.com',
        password='admin123',
        first_name='Admin',
        last_name='User'
    )
    print('Admin created: admin@test.com')

# Customer user
if not User.objects.filter(email='customer@test.com').exists():
    User.objects.create_user(
        email='customer@test.com',
        password='test123',
        first_name='John',
        last_name='Customer',
        role='customer'
    )
    print('Customer created: customer@test.com')

# Seller user
if not User.objects.filter(email='seller@test.com').exists():
    seller_user = User.objects.create_user(
        email='seller@test.com',
        password='test123',
        first_name='Jane',
        last_name='Seller',
        role='seller'
    )
    store = SellerProfile.objects.create(
        user=seller_user,
        store_name='Tech Haven',
        description='Best tech products at great prices',
        status='approved'
    )
    print('Seller created: seller@test.com with approved store')
else:
    seller_user = User.objects.get(email='seller@test.com')
    try:
        store = seller_user.seller_profile
    except:
        store = SellerProfile.objects.create(
            user=seller_user,
            store_name='Tech Haven',
            description='Best tech products at great prices',
            status='approved'
        )

# Categories
categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books']
cat_objs = {}
for cat_name in categories:
    cat, _ = Category.objects.get_or_create(
        name=cat_name,
        defaults={'slug': cat_name.lower().replace(' ', '-').replace('&', 'and')}
    )
    cat_objs[cat_name] = cat
    print(f'Category: {cat_name}')

# Sample products
sample_products = [
    {'name': 'Wireless Headphones', 'price': 79.99, 'stock': 50, 'category': 'Electronics', 'description': 'Premium sound quality wireless headphones with noise cancellation.'},
    {'name': 'Mechanical Keyboard', 'price': 129.99, 'stock': 30, 'category': 'Electronics', 'description': 'RGB mechanical keyboard with Cherry MX switches.'},
    {'name': 'USB-C Hub', 'price': 39.99, 'stock': 100, 'category': 'Electronics', 'description': '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader.'},
    {'name': 'Running Shoes', 'price': 89.99, 'stock': 25, 'category': 'Sports', 'description': 'Lightweight and breathable running shoes.'},
    {'name': 'Yoga Mat', 'price': 29.99, 'stock': 60, 'category': 'Sports', 'description': 'Non-slip premium yoga mat, 6mm thick.'},
    {'name': 'Python Programming Book', 'price': 49.99, 'stock': 40, 'category': 'Books', 'description': 'Complete guide to Python programming for beginners and experts.'},
]

for p_data in sample_products:
    if not Product.objects.filter(name=p_data['name'], seller=store).exists():
        Product.objects.create(
            seller=store,
            category=cat_objs[p_data['category']],
            name=p_data['name'],
            description=p_data['description'],
            price=p_data['price'],
            stock=p_data['stock'],
            is_active=True
        )
        print(f'Product created: {p_data["name"]}')

print('\nSeed data complete!')
print('Admin: admin@test.com / admin123')
print('Customer: customer@test.com / test123')
print('Seller: seller@test.com / test123')
