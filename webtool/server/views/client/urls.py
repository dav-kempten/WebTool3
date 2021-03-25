# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import GuideViewSet, ActivityViewSet, TopicViewSet, CollectiveViewSet, BookletViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet, basename='guides')
router.register(r'activities', ActivityViewSet, basename='activities')
router.register(r'topics', TopicViewSet, basename='topics')
router.register(r'collectives', CollectiveViewSet, basename='collectives')
router.register(r'booklets', BookletViewSet, basename='booklets')
