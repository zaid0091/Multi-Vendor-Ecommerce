"""
config/throttles.py
-------------------
Custom DRF throttle classes for the multi-vendor ecommerce API.

OWASP A04 / A07 — Insecure Design / Identification & Authentication Failures:
Rate limiting is applied at two granularities:

  1. General-purpose throttles (AnonBurstThrottle, UserBurstThrottle) are
     applied globally via REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'].

  2. Endpoint-specific throttles (LoginRateThrottle, RegisterRateThrottle) are
     applied only to the auth views that are most susceptible to brute-force.

On rate-limit breach Django REST Framework automatically returns:
  HTTP 429 Too Many Requests
  Retry-After: <seconds until the window resets>
"""

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AnonBurstThrottle(AnonRateThrottle):
    """
    Limits unauthenticated (anonymous) requests across ALL public endpoints.
    Rate is set via THROTTLE_ANON_BURST in .env (default: 30/minute).
    Keyed by the client IP address.
    """
    scope = 'anon_burst'


class UserBurstThrottle(UserRateThrottle):
    """
    Limits authenticated requests across ALL endpoints.
    Rate is set via THROTTLE_USER_BURST in .env (default: 120/minute).
    Keyed by the authenticated user's primary key.
    """
    scope = 'user_burst'


class LoginRateThrottle(AnonRateThrottle):
    """
    Tight throttle applied ONLY to POST /api/auth/login/.
    Defends against credential-stuffing and brute-force attacks.
    Rate: 5 attempts per minute per IP (configurable via THROTTLE_LOGIN).
    Uses AnonRateThrottle so it applies before authentication succeeds.
    """
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """
    Throttle applied ONLY to POST /api/auth/register/.
    Prevents automated account-creation abuse.
    Rate: 10 registrations per hour per IP (configurable via THROTTLE_REGISTER).
    """
    scope = 'register'
