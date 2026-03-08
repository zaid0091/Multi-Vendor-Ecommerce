from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/seller/', include('store.urls')),
    path('api/admin-panel/', include('users.admin_urls')),
    path('api/wishlist/', include('wishlist.urls')),
    path('api/coupons/', include('coupons.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
