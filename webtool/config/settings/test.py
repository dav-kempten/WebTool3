# -*- coding: utf-8 -*-
"""Settings für pytest-django.

Wird über pyproject.toml gezogen (DJANGO_SETTINGS_MODULE = "config.settings.test").

base.py liest die Zugangsdaten beim Import über get_env() aus os.environ und wirft
ImproperlyConfigured, sobald eine Variable fehlt. Die Defaults müssen deshalb VOR
dem Import von base gesetzt werden -- daher steht der Import nicht am Dateianfang.

Die Werte passen zum db-Service aus docker-compose.yml. Läuft auf dem Rechner schon
ein anderes PostgreSQL auf 5432, den Container auf einen freien Port legen (z. B. per
docker-compose.override.yml auf 5433) und DJCODE_DB_PORT=5433 setzen -- die Defaults
hier greifen nur, wenn die Variable nicht schon gesetzt ist.

PostgreSQL muss mindestens Version 14 sein; Django 6 lehnt ältere Server ab.
"""
import os

os.environ.setdefault('DJCODE_SECRET_KEY', 'test-only-not-a-secret')
os.environ.setdefault('DJCODE_DB_ENGINE', 'django.db.backends.postgresql')
os.environ.setdefault('DJCODE_DB_HOST', 'localhost')
os.environ.setdefault('DJCODE_DB_PORT', '5432')
os.environ.setdefault('DJCODE_DB_NAME', 'webtool')
os.environ.setdefault('DJCODE_DB_USER', 'djcode')
os.environ.setdefault('DJCODE_DB_PASSWORD', 'webtool-local')

from .base import *  # noqa: E402,F401,F403

DEBUG = False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# base.py cacht in einer DB-Tabelle, die in der Test-DB nicht angelegt wird.
CACHES = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
