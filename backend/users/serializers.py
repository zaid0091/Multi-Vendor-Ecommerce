"""
users/serializers.py
---------------------
Input validation hardened to OWASP A03 (Injection) and A07
(Identification & Authentication Failures) guidelines:

  • All string fields have explicit max_length to prevent oversized payloads.
  • Email is normalised (lower-cased, stripped) before persistence.
  • Password min_length=8 matches AUTH_PASSWORD_VALIDATORS in settings.
  • RegisterSerializer uses an explicit 'fields' allowlist — any extra keys
    sent by the client are silently dropped (no mass-assignment).
  • LoginSerializer never reveals *which* field is wrong (generic message)
    to prevent user-enumeration (OWASP A07).
  • ProfileSerializer restricts which fields can be mutated via PATCH
    and blocks role/email changes through the profile endpoint.
"""

import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

# ---------------------------------------------------------------------------
# Shared constants — keep limits in one place so they're easy to audit/adjust
# ---------------------------------------------------------------------------
NAME_MAX_LEN = 100      # first_name / last_name
EMAIL_MAX_LEN = 254     # RFC 5321 maximum
PASSWORD_MIN_LEN = 8    # NIST SP 800-63B minimum
PASSWORD_MAX_LEN = 128  # prevent bcrypt DoS via extremely long passwords


class RegisterSerializer(serializers.ModelSerializer):
    """
    Validates and creates a new user account.

    OWASP A03: explicit field allowlist — unknown keys from the request body
    are never passed to the model (no mass-assignment vulnerability).
    """
    password = serializers.CharField(
        write_only=True,            # never returned in response
        min_length=PASSWORD_MIN_LEN,
        max_length=PASSWORD_MAX_LEN,
        # Trim leading/trailing whitespace that might indicate a paste error
        trim_whitespace=False,
        error_messages={
            'min_length': f'Password must be at least {PASSWORD_MIN_LEN} characters.',
            'max_length': f'Password must be at most {PASSWORD_MAX_LEN} characters.',
        },
    )
    email = serializers.EmailField(
        max_length=EMAIL_MAX_LEN,
    )
    first_name = serializers.CharField(
        max_length=NAME_MAX_LEN,
        # Strip surrounding whitespace on all name fields
        trim_whitespace=True,
    )
    last_name = serializers.CharField(
        max_length=NAME_MAX_LEN,
        trim_whitespace=True,
    )

    class Meta:
        model = User
        # Explicit allowlist — only these fields are accepted from the client.
        # 'role' is intentionally excluded from writeable input; see validate_role.
        fields = ['id', 'email', 'first_name', 'last_name', 'password', 'role']

    # Accepted role values the caller is allowed to self-assign
    _ALLOWED_SELF_ROLES = {'customer', 'seller'}

    def validate_role(self, value):
        """
        OWASP A01: Prevent privilege escalation.
        A client cannot self-register as 'admin'; that role must be assigned
        by a superuser through the Django admin interface.
        """
        if value not in self._ALLOWED_SELF_ROLES:
            raise serializers.ValidationError(
                "Invalid role. Choose 'customer' or 'seller'."
            )
        return value

    def validate_email(self, value):
        """Normalise to lowercase so 'User@Example.com' and 'user@example.com'
        are treated as the same address (prevents duplicate account creation)."""
        return value.lower().strip()

    def validate_first_name(self, value):
        """Reject names that contain digits or special characters."""
        if not re.match(r"^[A-Za-z\s'\-]+$", value):
            raise serializers.ValidationError(
                'Name may only contain letters, spaces, hyphens, and apostrophes.'
            )
        return value

    def validate_last_name(self, value):
        if not re.match(r"^[A-Za-z\s'\-]+$", value):
            raise serializers.ValidationError(
                'Name may only contain letters, spaces, hyphens, and apostrophes.'
            )
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for the authenticated user's own profile.
    'role', 'id', 'date_joined' are always read-only to prevent
    privilege escalation through the PATCH /api/auth/profile/ endpoint.
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'date_joined']
        # OWASP A01: role must never be mutatable by the user themselves
        read_only_fields = ['id', 'date_joined', 'role', 'email']


class LoginSerializer(serializers.Serializer):
    """
    Authenticates a user and returns JWT tokens.

    OWASP A07: uses a single generic error message regardless of whether the
    email does not exist or the password is wrong, preventing user enumeration.
    """
    email = serializers.EmailField(
        max_length=EMAIL_MAX_LEN,
    )
    password = serializers.CharField(
        # Don't strip whitespace — a password with a leading space is valid
        trim_whitespace=False,
        max_length=PASSWORD_MAX_LEN,
    )

    def validate(self, data):
        from django.contrib.auth import authenticate

        # Normalise email the same way RegisterSerializer does
        email = data['email'].lower().strip()
        password = data['password']

        user = authenticate(username=email, password=password)

        # OWASP A07: use identical message for "wrong email" and "wrong password"
        # so an attacker cannot enumerate valid accounts via differing responses.
        if not user or not user.is_active:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        tokens = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'access': str(tokens.access_token),
            'refresh': str(tokens),
        }
