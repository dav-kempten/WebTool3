.. _config:

Config - Modul
==============
Das Config-Module beinhaltet alle Einstellungen, die das Backend betreffen. Hier liegen die Konfigurationen für die lokalen
sowie produktiven Betrieb des Django-Servers.

Routing
~~~~~~~
Hier sind unter anderem die Base-URLs der einzelnen Unterabschnitte definiert und die weiterführenden Abschnitte eingebunden.
In unserem Fall sind hier die API-Abschnitte für die Authentifikation, den ``Client``, welcher später die Daten für die
Homepage bereitstellt, und das ``Frontend``, welcher später die Daten für das Frontend bereitstellt, eingebunden. Zusätzlich
wird hier der Pfad für den ``admin``-Zugang festgelegt und die Admin-URLs eingebunden.

.. code-block:: python

    from django.conf.urls import include, url
    from django.contrib import admin

    from server.views.auth import urls as auth_urls
    from server.views.client import client_router
    from server.views.frontend import frontend_router

    urlpatterns = [
        url(r'^admin/', admin.site.urls),
        url(r'^api/', include(auth_urls)),
        url(r'^api/client/', include(client_router.urls)),
        url(r'^api/frontend/', include(frontend_router.urls)),
    ]

Die Module ``client_router`` und ``frontend_router`` definieren noch die weiteren URLs für das Frontend- und Client-APIs.

uWSGI-Konfiguration
~~~~~~~~~~~~~~~~~~~
``uWSGI`` ist ein Open-Source-Projekt, welches einen Anwendungsserver für Webanwendungen bereitstellt. ``uWSGI`` wurde
nach der Schnittstellen-Spezifikation WSGI benannt und implementiert diese Spezifikation. Im Produktivbetrieb von
Webapplikationen übermittelt uWSGI die Anfragen vom Webserver (z. B. ``NGINX``) an die Webapplikation und zurück.

Der ``uWSGI``-Service für unseren Django-Webserver muss entsprechend konfiguriert werden:

.. code-block:: python

    import os

    from django.core.wsgi import get_wsgi_application

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    application = get_wsgi_application()

Basiskonfiguration
~~~~~~~~~~~~~~~~~~
In der Basis-Konfiguration liegen alle Konfigurationen, die sich Produktiv- und Entwicklungssystem teilen. Hier werden
die für Django nötigen Unterapplikationen (``INSTALLED_APPS``), Middlewares (``MIDDLEWARE``) und Templates (``TEMPLATES``)
eingebunden.

.. code-block:: python


    import os
    from django.core.exceptions import ImproperlyConfigured


    def get_env(name):
        try:
            return os.environ[name]
        except KeyError:
            raise ImproperlyConfigured("environment variable '{}' is missing.".format(name))


    # Build paths inside the project like this: os.path.join(BASE_DIR, ...)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # See https://docs.djangoproject.com/en/1.11/ref/contrib/sites/
    SITE_ID = 1

    # Quick-start development settings - unsuitable for production
    # See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY = get_env('DJCODE_SECRET_KEY')

    # Application definition

    INSTALLED_APPS = [
        'apps.WebtoolAdminConfig',
        'django.contrib.sites',
        'django.contrib.redirects',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.staticfiles',
        'django.contrib.messages',
        'rest_framework',
        'django_filters',
        'corsheaders',
        'server',
        'admin_reorder',
    ]

    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
        'django.contrib.redirects.middleware.RedirectFallbackMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'admin_reorder.middleware.ModelAdminReorder',
    ]

    ROOT_URLCONF = 'config.urls'

    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [os.path.join(BASE_DIR, 'templates')],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                ],
            },
        },
    ]

    WSGI_APPLICATION = 'config.wsgi.application'

Zusätzlich ist es nötig, auf Grundlage der Umgebungsvariablen und die darunterliegende Datenbank für Django zu konfigurieren.
Dazu holt man sich die Umgebungsvariablen (``get_env``) des Produktionssystems und parametrisiert die Datenbank.

.. code-block:: python


    # Database
    # https://docs.djangoproject.com/en/1.11/ref/settings/#databases

    DATABASES = {
        'default': {
            'ENGINE': get_env('DJCODE_DB_ENGINE'),
            'HOST': get_env('DJCODE_DB_HOST'),
            'PORT': get_env('DJCODE_DB_PORT'),
            'NAME': get_env('DJCODE_DB_NAME'),
            'USER': get_env('DJCODE_DB_USER'),
            'PASSWORD': get_env('DJCODE_DB_PASSWORD'),
        }
    }

Um Performance-Probleme bei Django vorzubeugen, werden die Einträge der Datenbank und der REST-API gecached. Die REST-API
muss auch noch passend konfiguriert werden. Die REST-API nimmt alle Anfragen bezüglich der Authentifizierung und alle anderen
HTTP-Requests entgegen.

.. code-block:: python


    # Cache
    # https://docs.djangoproject.com/en/1.11/topics/cache/#database-caching
    # https://docs.djangoproject.com/en/1.11/ref/settings/#caches

    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'wt3_cache',
        }
    }

    # http://www.django-rest-framework.org/api-guide/filtering/

    REST_FRAMEWORK = {
        'DEFAULT_FILTER_BACKENDS': (
            'django_filters.rest_framework.DjangoFilterBackend',
            'rest_framework.filters.SearchFilter'
        ),
        'DEFAULT_AUTHENTICATION_CLASSES': (
            'rest_framework.authentication.SessionAuthentication',
        ),
        'DEFAULT_PERMISSION_CLASSES': (
            'rest_framework.permissions.AllowAny',
        )
    }

Die Authentifizierungsschnittstelle ermöglicht, bei richtigen Daten, den Aufbau einer Session mit dem Django-Server.
Innerhalb einer Session ist es möglich authentifizierte Requests an den Server zu schicken. Der Django-Server verarbeitet
die Anfragen dann nach dem hinterlegten Permission-Richtlinien.

.. code-block:: python


    AUTHENTICATION_BACKENDS = [
        'server.backend.Backend',
        'django.contrib.auth.backends.ModelBackend'
    ]

    # Password validation
    # https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ]

Zudem gibt es noch allgemeine Konfigurationen wie die Sprach- und Zeitzoneneinstellungen. Zudem können z.B. für die Nutzung
eines Backendszugangs die statischen Daten, wie die CSS-Daten, gesammelt und auf dem Server abgelegt werden. Die
statischen Daten unterstützen einen flüssigeren Ablauf das Backends bei der Ansteuerung durch den Browser.

.. code-block:: python


    # Internationalization
    # https://docs.djangoproject.com/en/1.11/topics/i18n/

    LANGUAGE_CODE = 'de-DE'

    TIME_ZONE = 'Europe/Berlin'

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True


    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/1.11/howto/static-files/

    STATIC_URL = '/static/'

Lokalkonfiguration
~~~~~~~~~~~~~~~~~~
Die lokale Konfiguration bestimmt die finale Konfiguration für den Entwicklungsserver unter Django. Hier soll der
Webserver noch debugbar sein (``DEBUG = True``).

.. code-block:: python


    from .base import *

    DEBUG = True
    CORS_ORIGIN_ALLOW_ALL = False

    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

    PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_ROOT = os.path.join(PROJECT_DIR, 'static')

Produktivkonfiguration
~~~~~~~~~~~~~~~~~~~~~~
Im Gegensatz zu den Lokalkonfigurationen bestimmen die Produktivkonfigurationen den Status des Produktivsystems. Hier
soll nicht mehr gedebugt werden (``DEBUG = False``) und die statischen Ordner sind fest auf dem Produktivserver festgelegt.

.. code-block:: python


    from .base import *

    DEBUG = False

    USE_X_FORWARDED_HOST = False
    USE_X_FORWARDED_PORT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    ALLOWED_HOSTS = ['webtool.dav-kempten.de', '46.252.16.44']

    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, 'static')
    ]

    CORS_ORIGIN_ALLOW_ALL = False

    CORS_URLS_REGEX = r'^/api/.*$'

    CORS_ORIGIN_WHITELIST = (
        'www.dav-kempten.de',
        'www.dav-kempten-neue-hoempage.de',
        'dav-kempten-neue-hoempage.de',
        'dav-kempten.de',
    )

    CSRF_TRUSTED_ORIGINS = ['.dav-kempten.de']
    CSRF_COOKIE_SECURE = True

    STATIC_ROOT = '/var/www/webtool/static'

    STATIC_URL = '/static/'
