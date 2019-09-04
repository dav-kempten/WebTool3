# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import NamesViewSet
from . import ValuesViewSet
from . import CalendarsViewSet
from . import InstructionViewSet
from . import TourViewSet
from . import TalkViewSet

router = DefaultRouter()
router.register(r'names', NamesViewSet, base_name='names')
router.register(r'values', ValuesViewSet, base_name='values')
router.register(r'calendars', CalendarsViewSet, base_name='calendars')
router.register(r'instructions', InstructionViewSet, base_name='instructions')
router.register(r'tours', TourViewSet, base_name='tours')
router.register(r'talks', TalkViewSet, base_name='talks')