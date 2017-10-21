# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import GuideViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet)
router.register(r'activities', ActivityViewSet)
