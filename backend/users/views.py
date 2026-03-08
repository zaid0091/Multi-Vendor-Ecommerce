"""
users/views.py
--------------
Auth and profile views with per-endpoint rate limiting.

OWASP A07 — Identification & Authentication Failures:
  • LoginView  → LoginRateThrottle  (5/minute per IP)
  • RegisterView → RegisterRateThrottle (10/hour per IP)

These are *in addition* to the global AnonBurstThrottle / UserBurstThrottle
applied by DEFAULT_THROTTLE_CLASSES in settings.py.

On limit breach DRF returns HTTP 429 with a Retry-After header automatically.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from config.throttles import LoginRateThrottle, RegisterRateThrottle
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .models import User, NewsletterSubscriber


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new user account.  Throttled to 10 requests/hour per IP to
    prevent automated bulk account creation (OWASP A07).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(tokens.access_token),
                'refresh': str(tokens),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticates a user and returns JWT access + refresh tokens.
    Throttled to 5 attempts/minute per IP to block brute-force and
    credential-stuffing attacks (OWASP A07).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data)
        # HTTP 401 (not 400) so the frontend can distinguish auth failures
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(APIView):
    """
    GET  /api/auth/profile/  — returns the authenticated user's profile.
    PATCH /api/auth/profile/ — updates first_name / last_name only.

    Role and email are read-only (enforced in UserSerializer.read_only_fields).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        # partial=True so the client only needs to send changed fields
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BecomeSellerView(APIView):
    """
    POST /api/auth/become-seller/
    Upgrades a 'customer' account to 'seller' role.
    Returns fresh JWT tokens so the frontend gets an updated role claim.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role == 'seller':
            return Response({'detail': 'Already a seller.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.role == 'admin':
            return Response({'detail': 'Admins cannot become sellers.'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = 'seller'
        user.save(update_fields=['role'])
        tokens = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(tokens.access_token),
            'refresh': str(tokens),
        })


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Body: { current_password, new_password }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current = request.data.get('current_password', '')
        new = request.data.get('new_password', '')

        if not current or not new:
            return Response({'error': 'Both current_password and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(current):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new)
        request.user.save()
        return Response({'message': 'Password changed successfully.'})


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/
    Body: { email }
    Generates a 1-hour token and prints it to the server console (dev mode).
    In production, swap the print() for an email send.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import secrets
        from django.utils import timezone
        from datetime import timedelta

        email = request.data.get('email', '').lower().strip()
        # Always return 200 to avoid user enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'message': 'If that email exists, a reset link has been sent.'})

        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = timezone.now() + timedelta(hours=1)
        user.save(update_fields=['password_reset_token', 'password_reset_expires'])

        # In development, print the token so the developer can use it directly
        print(f'\n[PASSWORD RESET] Token for {email}: {token}\n')

        return Response({'message': 'If that email exists, a reset link has been sent.', 'dev_token': token})


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Body: { token, new_password }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.utils import timezone

        token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')

        if not token or not new_password:
            return Response({'error': 'Token and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.password_reset_expires < timezone.now():
            return Response({'error': 'Reset token has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()

        return Response({'message': 'Password reset successfully. You can now log in.'})


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklists the refresh token so it can never be used to mint new access
    tokens (OWASP A07 — proper session termination).
    Requires body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token was already invalid/expired — still return 200 so the
            # client clears its local storage (idempotent logout).
            pass
        return Response({'message': 'Logged out successfully.'})


class NewsletterSubscribeView(APIView):
    """
    POST /api/auth/newsletter/
    Body: { email }
    Anyone can subscribe — no auth required.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        if not email or '@' not in email:
            return Response({'error': 'A valid email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        _, created = NewsletterSubscriber.objects.get_or_create(email=email)
        if created:
            return Response({'message': 'Successfully subscribed!'}, status=status.HTTP_201_CREATED)
        return Response({'message': "You're already subscribed."}, status=status.HTTP_200_OK)
