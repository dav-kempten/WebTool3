# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import GuideViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet)
