# -*- coding: utf-8 -*-

import datetime

from django.http import Http404
from rest_framework.authentication import TokenAuthentication
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Event, Reference
from server.permissions import IsApprovedOrReadOnly
from server.serializers.admin import SessionListSerializer, SessionSerializer


class SessionViewSet(viewsets.ViewSet):

    authentication_classes = (TokenAuthentication, )
    permission_classes = (IsApprovedOrReadOnly, )

    lookup_field = 'reference'
    lookup_value_regex = '[A-Z]{3}-\d{3}'

    def list(self, request):
        queryset = Event.objects.filter(session__isnull=False)
        serializer = SessionListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, reference):

        try:
            reference = Reference.get_reference(reference)
        except Reference.DoesNotExist:
            raise Http404

        serializer = SessionSerializer(reference.event, context={'request': request})
        return Response(serializer.data)

    def create(self, request):
        pass

    def update(self, request, pk=None):
        pass

    def partial_update(self, request, pk=None):
        pass

    def destroy(self, request, pk=None):
        pass
