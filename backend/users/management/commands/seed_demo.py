from django.core.management.base import BaseCommand
from users.models import User
from store.models import SellerProfile


class Command(BaseCommand):
    help = 'Seed demo users for development'

    def handle(self, *args, **options):
        # Admin
        if not User.objects.filter(email='admin@test.com').exists():
            User.objects.create_superuser(
                email='admin@test.com',
                password='admin123',
                first_name='Admin',
                last_name='User',
            )
            self.stdout.write(self.style.SUCCESS('[CREATED] admin@test.com / admin123'))
        else:
            u = User.objects.get(email='admin@test.com')
            u.set_password('admin123')
            u.role = 'admin'
            u.is_staff = True
            u.is_superuser = True
            u.is_active = True
            u.save()
            self.stdout.write(self.style.WARNING('[UPDATED] admin@test.com / admin123'))

        # Customer
        if not User.objects.filter(email='customer@test.com').exists():
            User.objects.create_user(
                email='customer@test.com',
                password='test123',
                first_name='John',
                last_name='Customer',
                role='customer',
            )
            self.stdout.write(self.style.SUCCESS('[CREATED] customer@test.com / test123'))
        else:
            u = User.objects.get(email='customer@test.com')
            u.set_password('test123')
            u.is_active = True
            u.save()
            self.stdout.write(self.style.WARNING('[UPDATED] customer@test.com / test123'))

        # Seller
        if not User.objects.filter(email='seller@test.com').exists():
            seller_user = User.objects.create_user(
                email='seller@test.com',
                password='test123',
                first_name='Jane',
                last_name='Seller',
                role='seller',
            )
        else:
            seller_user = User.objects.get(email='seller@test.com')
            seller_user.set_password('test123')
            seller_user.is_active = True
            seller_user.save()

        if not SellerProfile.objects.filter(user=seller_user).exists():
            SellerProfile.objects.create(
                user=seller_user,
                store_name='Tech Haven',
                description='Best tech products at great prices',
                status='approved',
            )
            self.stdout.write(self.style.SUCCESS('[CREATED] seller@test.com / test123 + store'))
        else:
            self.stdout.write(self.style.WARNING('[UPDATED] seller@test.com / test123'))

        self.stdout.write(self.style.SUCCESS('\nDemo users ready!'))
