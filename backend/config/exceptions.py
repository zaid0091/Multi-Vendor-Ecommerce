"""
config/exceptions.py
---------------------
Custom DRF exception handler.

Ensures ALL error responses — including throttle 429s — are returned as
consistent JSON objects, never as Django's default HTML error pages.

Response envelope:
  {
    "error": "<human-readable summary>",
    "detail": <original DRF error detail>   # omitted for 5xx
  }
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    # Let DRF build its standard response first
    response = exception_handler(exc, context)

    if response is not None:
        # Normalise the body so the frontend always sees { error, detail }
        original_data = response.data
        response.data = {
            'error': _summarise(response.status_code),
            'detail': original_data,
        }
    return response


def _summarise(status_code: int) -> str:
    """Return a human-readable one-liner for common HTTP error codes."""
    messages = {
        400: 'Invalid request data.',
        401: 'Authentication credentials were not provided or are invalid.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        405: 'Method not allowed.',
        # OWASP A04: always include a Retry-After hint (DRF adds the header automatically)
        429: 'Too many requests. Please slow down and try again later.',
        500: 'An internal server error occurred.',
    }
    return messages.get(status_code, f'HTTP {status_code} error.')
