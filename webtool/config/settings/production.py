from .base import *

try:
    from .admin import *
except ModuleNotFoundError:
    ADMINS = []
    pass

DEBUG = False

USE_X_FORWARDED_HOST = False
USE_X_FORWARDED_PORT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

ALLOWED_HOSTS = ['webtool.dav-kempten.de', '46.252.16.44']

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
    # '/usr/local/lib/python3.6/site-packages/django/contrib/admin/static',
]

from .cors import *

CSRF_TRUSTED_ORIGINS = ['https://*.dav-kempten.de']
CSRF_COOKIE_SECURE = True

STATIC_ROOT = '/var/www/webtool/static'

STATIC_URL = '/static/'
