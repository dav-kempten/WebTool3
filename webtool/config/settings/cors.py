# -*- coding: utf-8 -*-
"""
CORS for the homepage: which origins may call /api/ from the browser.

django-cors-headers compares CORS_ALLOWED_ORIGINS exactly (scheme and host),
so an entry like 'https://*.dav-kempten.de' matches nothing. Subdomains need
CORS_ALLOWED_ORIGIN_REGEXES. The pattern allows the bare domain and any
subdomain, but not look-alikes such as 'https://evil-dav-kempten.de'.

Kept free of environment lookups, so the tests can load it without the
production secrets.
"""

CORS_ALLOW_ALL_ORIGINS = False

CORS_URLS_REGEX = r'^/api/.*$'

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://([a-z0-9-]+\.)*dav-kempten\.de$',
    r'^https://([a-z0-9-]+\.)*dav-kempten-neue-homepage\.de$',
]
