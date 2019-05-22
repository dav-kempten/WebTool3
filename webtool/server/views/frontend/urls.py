# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import NamesViewSet
from . import ValuesViewSet
from . import CalendarsViewSet
from . import InstructionViewSet

router = DefaultRouter()
router.register(r'names', NamesViewSet)
router.register(r'values', ValuesViewSet, base_name='values')
router.register(r'calendars', CalendarsViewSet)
router.register(r'instructions', InstructionViewSet)
