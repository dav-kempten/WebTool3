from .base import *

DEBUG = True
CORS_ORIGIN_ALLOW_ALL = False

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']


PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(PROJECT_DIR, 'static')

# INSTALLED_APPS += ("debug_toolbar", )

