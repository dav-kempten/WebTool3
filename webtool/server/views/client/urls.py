# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import GuideViewSet, ActivityViewSet, TopicViewSet, CollectiveViewSet, BookletViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet, base_name='guides')
router.register(r'activities', ActivityViewSet, base_name='activities')
router.register(r'topics', TopicViewSet, base_name='topics')
router.register(r'collectives', CollectiveViewSet, base_name='collectives')
router.register(r'booklets', BookletViewSet, base_name='booklets')
