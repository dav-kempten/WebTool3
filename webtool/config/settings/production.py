from .base import *

DEBUG = False

USE_X_FORWARDED_HOST = False
USE_X_FORWARDED_PORT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

ALLOWED_HOSTS = ['webtool.dav-kempten.de', '46.252.16.44']

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

CORS_ORIGIN_ALLOW_ALL = False

CORS_URLS_REGEX = r'^/api/.*$'

CORS_ORIGIN_WHITELIST = (
    'www.dav-kempten.de',
    'www.dav-kempten-neue-hoempage.de',
    'dav-kempten-neue-hoempage.de',
    'dav-kempten.de',
)

STATIC_ROOT = "/home/djcode/static"
