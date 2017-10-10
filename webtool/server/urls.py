from django.conf.urls import include, url

from . import views

urlpatterns = [
    url(r'api/client/', include(views.client.router.urls)),
]
