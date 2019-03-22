# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import NamesViewSet

router = DefaultRouter()
router.register(r'names', NamesViewSet)
