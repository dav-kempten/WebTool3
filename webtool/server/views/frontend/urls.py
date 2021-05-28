# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import NamesViewSet
from . import ValuesViewSet
from . import CalendarsViewSet
from . import InstructionViewSet
from . import TourViewSet
from . import TalkViewSet
from . import SessionViewSet
from . import TourcalendarViewSet
from . import InstructioncalendarViewSet
from . import GuideViewSet

router = DefaultRouter()
router.register(r'names', NamesViewSet, basename='names')
router.register(r'values', ValuesViewSet, basename='values')
router.register(r'calendars', CalendarsViewSet, basename='calendars')
router.register(r'instructions', InstructionViewSet, basename='instructions')
router.register(r'tours', TourViewSet, basename='tours')
router.register(r'talks', TalkViewSet, basename='talks')
router.register(r'sessions', SessionViewSet, basename='sessions')
router.register(r'tourcalendar', TourcalendarViewSet, basename='tourcalendar')
router.register(r'instructioncalendar', InstructioncalendarViewSet, basename='instructioncalendar')
router.register(r'guides', GuideViewSet, basename='guides')
