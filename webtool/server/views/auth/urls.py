# -*- coding: utf-8 -*-

from django.urls import path, re_path, include
from . import LoginView, LogoutView

urlpatterns = [
    re_path(r'^login/$', LoginView.as_view(), name='user-login'),
    re_path(r'^logout/$', LogoutView.as_view(), name='user-logout'),
]
