"""config URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.dashboard, name='dashboard')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='dashboard')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import include, url

from server.views.auth import urls as auth_urls
from server.views.client import client_router
from server.views.frontend import frontend_router

urlpatterns = [
    url(r'^api/', include(auth_urls)),
    url(r'^api/client/', include(client_router.urls)),
    url(r'^api/frontend/', include(frontend_router.urls)),
]
