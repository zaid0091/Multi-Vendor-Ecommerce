"""
store/serializers.py
---------------------
Input validation hardened for seller store creation/update.

OWASP A03:
  • store_name: max 100 chars, no control characters
  • description: max 1000 chars
  • logo: same image size/type validation as products
  • SellerProfileSerializer only exposes safe read fields to clients
  • SellerProfileCreateSerializer explicitly allowlists writable fields
    so the 'status' (approved/suspended) and 'user' can never be mass-assigned
"""

import re
from rest_framework import serializers
from .models import SellerProfile
from users.serializers import UserSerializer

STORE_NAME_MAX_LEN = 100
STORE_DESC_MAX_LEN = 1000
LOGO_MAX_BYTES = 2 * 1024 * 1024       # 2 MB for logos
ALLOWED_LOGO_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


class SellerProfileSerializer(serializers.ModelSerializer):
    """Read serializer — returned to clients when viewing store info."""
    user = UserSerializer(read_only=True)
    total_products = serializers.SerializerMethodField()
    total_sales = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = [
            'id', 'user', 'store_name', 'description', 'logo',
            'status', 'created_at', 'total_products', 'total_sales',
        ]
        # OWASP A01: status and user can never be set by the seller themselves
        read_only_fields = ['id', 'status', 'created_at', 'user']

    def get_total_products(self, obj):
        return obj.products.count()

    def get_total_sales(self, obj):
        from orders.models import SellerOrder
        from django.db.models import Sum
        total = SellerOrder.objects.filter(
            seller=obj, order__payment_status='paid'
        ).aggregate(total=Sum('subtotal'))['total']
        return float(total) if total else 0.0


class SellerProfileCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for POST /api/seller/store/ and PATCH /api/seller/store/.

    OWASP A03 — validated constraints:
      • store_name: 3–100 chars, alphanumeric + spaces/hyphens only
      • description: max 1000 chars
      • logo: max 2 MB, JPEG/PNG/WebP only
    """
    store_name = serializers.CharField(
        max_length=STORE_NAME_MAX_LEN,
        min_length=3,
        trim_whitespace=True,
    )
    description = serializers.CharField(
        max_length=STORE_DESC_MAX_LEN,
        trim_whitespace=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = SellerProfile
        # Explicit allowlist — 'status', 'user', 'created_at' excluded
        fields = ['store_name', 'description', 'logo']

    def validate_store_name(self, value):
        """Allow letters, digits, spaces, hyphens and apostrophes only."""
        if not re.match(r"^[A-Za-z0-9\s'\-&.]+$", value):
            raise serializers.ValidationError(
                "Store name may only contain letters, numbers, spaces, "
                "hyphens, apostrophes, ampersands, and full stops."
            )
        return value

    def validate_logo(self, logo):
        """Reject oversized or non-image logo uploads."""
        if logo is None:
            return logo

        if logo.size > LOGO_MAX_BYTES:
            raise serializers.ValidationError(
                f'Logo file too large. Maximum allowed size is '
                f'{LOGO_MAX_BYTES // (1024 * 1024)} MB.'
            )

        content_type = getattr(logo, 'content_type', '')
        if content_type not in ALLOWED_LOGO_TYPES:
            raise serializers.ValidationError(
                'Unsupported logo format. Please upload a JPEG, PNG, or WebP image.'
            )

        return logo
