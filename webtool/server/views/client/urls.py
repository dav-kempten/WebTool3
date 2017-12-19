# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import GuideViewSet, ActivityViewSet, TopicViewSet, CollectiveViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'topics', TopicViewSet)
router.register(r'collectives', CollectiveViewSet)
