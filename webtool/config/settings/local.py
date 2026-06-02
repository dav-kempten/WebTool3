import os
import environ

from .base import * # 2. Wir initialisieren django-environ NUR für diese lokale Datei
env = environ.Env()

# 3. Wir überschreiben gezielt die kritischen Werte für Docker
DEBUG = True
CORS_ORIGIN_ALLOW_ALL = False
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_ROOT = os.path.join(PROJECT_DIR, 'static')

# 4. Die Datenbank-Verbindung wird mit der Docker-Datenbank überschrieben
DATABASES = {
    'default': env.db('DATABASE_URL')
}
