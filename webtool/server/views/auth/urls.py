# -*- coding: utf-8 -*-

from django.conf.urls import url

from . import LoginView, LogoutView

urlpatterns = [
    url(r'^login/$', LoginView.as_view(), name='user-login'),
    url(r'^logout/$', LogoutView.as_view(), name='user-logout'),
]
