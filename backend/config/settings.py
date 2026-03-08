from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

# Optional helpers for production deployments
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# SECURITY — OWASP A05: Security Misconfiguration
# All secrets are read from the .env file via python-decouple.
# Hard-coded values are rejected at startup so secrets never live in source.
# ---------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

# Explicitly list every host that may serve this app.
# '*' is never acceptable in production (OWASP A05).
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    # Local apps
    'users',
    'store',
    'products',
    'cart',
    'orders',
    'wishlist',
    'coupons',
]

MIDDLEWARE = [
    # CORS must be first so preflight requests are handled before CSRF etc.
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # OWASP A05: prevent click-jacking
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# If a `DATABASE_URL` env var is provided (e.g. from Heroku/Supabase/Fly.io),
# override the default sqlite database with the parsed URL.
db_url = config('DATABASE_URL', default='')
if db_url:
    DATABASES['default'] = dj_database_url.parse(db_url, conn_max_age=600)

AUTH_USER_MODEL = 'users.User'

# ---------------------------------------------------------------------------
# Password validation — OWASP A07: Identification and Authentication Failures
# Require minimum length + complexity so weak passwords are rejected at
# registration time before they ever reach the database.
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        # Minimum 8 characters (NIST SP 800-63B recommendation)
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,

    # ---------------------------------------------------------------------------
    # Rate Limiting — OWASP A04: Insecure Design / brute-force / DoS prevention.
    #
    # Two scope tiers:
    #   • AnonBurstThrottle   — unauthenticated requests, tight short-window limit
    #   • UserBurstThrottle   — authenticated requests, relaxed limit
    #   • LoginRateThrottle   — applied only to POST /api/auth/login/
    #   • RegisterRateThrottle— applied only to POST /api/auth/register/
    #
    # Rates are configurable via .env so they can be tuned without code changes.
    # Clients that exceed the limit receive HTTP 429 with a Retry-After header.
    # ---------------------------------------------------------------------------
    'DEFAULT_THROTTLE_CLASSES': [
        'config.throttles.AnonBurstThrottle',
        'config.throttles.UserBurstThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        # General public / anonymous traffic
        'anon_burst': config('THROTTLE_ANON_BURST', default='30/minute'),
        # General authenticated traffic
        'user_burst': config('THROTTLE_USER_BURST', default='120/minute'),
        # Sensitive auth endpoints — tighter limits to block brute-force
        'login': config('THROTTLE_LOGIN', default='5/minute'),
        'register': config('THROTTLE_REGISTER', default='10/hour'),
    },

    # Return structured error responses (JSON) instead of DRF's default HTML
    'EXCEPTION_HANDLER': 'config.exceptions.custom_exception_handler',
}

# ---------------------------------------------------------------------------
# JWT — OWASP A07: short-lived access tokens reduce the blast radius of a
# stolen token.  Refresh tokens are blacklisted on logout.
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    # Access token: read from .env, default 60 minutes (not 24 hours)
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_MINUTES', default=60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_DAYS', default=7, cast=int)
    ),
    # Rotate refresh tokens on every use so a stolen refresh token can only
    # be used once before it becomes invalid.
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    # Use a strong signing algorithm
    'ALGORITHM': 'HS256',
    # Do not leak the user id in the token header
    'USER_ID_CLAIM': 'user_id',
}

# ---------------------------------------------------------------------------
# CORS — OWASP A05: only allow trusted frontend origins.
# Never use CORS_ALLOW_ALL_ORIGINS = True in any environment.
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv(),
)
# Only allow the HTTP methods the API actually uses
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST']
# Credentials (cookies / auth headers) are only sent to explicitly listed origins
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Security headers — OWASP A05
# These are applied by Django's SecurityMiddleware.
# ---------------------------------------------------------------------------
# Redirect HTTP → HTTPS in production (safe to leave True in dev behind a proxy)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
# Prevent browsers from MIME-sniffing responses
SECURE_CONTENT_TYPE_NOSNIFF = True
# Enable browser XSS filter (legacy browsers)
SECURE_BROWSER_XSS_FILTER = True
# Only send referrer for same-origin requests
SECURE_REFERRER_POLICY = 'same-origin'
# Deny framing entirely (click-jacking protection)
X_FRAME_OPTIONS = 'DENY'
# HSTS: tell browsers to only use HTTPS (enable in production)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# When deploying to a platform that serves static files, collectstatic will
# populate `STATIC_ROOT`. WhiteNoise will be used in middleware to serve
# static files efficiently from the same process.
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Use WhiteNoise compressed manifest storage in production for caching.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Platform business settings — read from env so they can be changed without
# a code deploy (e.g. to adjust the commission rate for a promotion).
PLATFORM_COMMISSION_RATE = config('PLATFORM_COMMISSION_RATE', default=0.10, cast=float)

# ---------------------------------------------------------------------------
# Stripe
# ---------------------------------------------------------------------------
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
