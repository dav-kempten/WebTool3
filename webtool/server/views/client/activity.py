# -*- coding: utf-8 -*-
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from server.serializers.client import ActivityListSerializer, ActivitySerializer
from server.models import Event, Tour, Talk, Instruction, Session, Reference


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "reference"
    lookup_url_kwarg = "reference"
    queryset = Event.objects.filter(
        season__current=True, deprecated=False, internal=False,
        deadline__isnull=True, preliminary__isnull=True,
    ).exclude(
        tour__isnull=False, tour__state__public=False
    ).exclude(
        talk__isnull=False, talk__state__public=False
    ).exclude(
        instruction__isnull=False, talk__state__public=False
    ).exclude(
        session__isnull=False, session__state__public=False
    )

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivityListSerializer
        return ActivitySerializer

    def get_object(self):

        queryset = self.filter_queryset(self.get_queryset())

        # Perform the lookup filtering.
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument '
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            'attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )

        reference = Reference.get_reference(self.kwargs[self.lookup_url_kwarg])
        obj = get_object_or_404(queryset, reference=reference)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    class Meta:
        model = Event
