# -*- coding: utf-8 -*-

from rest_framework.routers import DefaultRouter, APIRootView
from rest_framework.authentication import TokenAuthentication
from server.permissions import IsApprovedOrReadOnly
from .instruction import InstructionViewSet
from .session import SessionViewSet


class AdminRootView(APIRootView):

    authentication_classes = (TokenAuthentication, )
    permission_classes = (IsApprovedOrReadOnly, )


router = DefaultRouter()
router.APIRootView = AdminRootView
router.register(r'instructions', InstructionViewSet, base_name='instruction')
router.register(r'sessions', SessionViewSet, base_name='session')
