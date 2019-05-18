# -*- coding: utf-8 -*-
from rest_framework.routers import DefaultRouter
from . import NamesViewSet
from . import ValuesViewSet

router = DefaultRouter()
router.register(r'names', NamesViewSet)
router.register(r'values', ValuesViewSet, base_name='values')
