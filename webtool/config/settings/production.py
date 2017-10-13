from .base import *

DEBUG = False

ALLOWED_HOSTS = ['webtool.dav-kempten.de', '46.252.16.44']

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

STATIC_ROOT = "/home/djcode/static"
