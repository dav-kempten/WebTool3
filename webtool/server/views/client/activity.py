# -*- coding: utf-8 -*-
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.filters.client import ActivityFilter
from server.serializers.client import ActivityListSerializer, ActivitySerializer
from server.models import Event, Tour, Talk, Instruction, Session, Reference


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "reference"
    lookup_url_kwarg = "reference"
    queryset = Event.objects.filter(
        season__current=True
    ).exclude(
        deprecated=True
    ).exclude(
        internal=True
    ).exclude(
        deadline__isnull=False
    ).exclude(
        preliminary__isnull=False
    ).exclude(
        instruction__isnull=False
    ).exclude(
        tour__isnull=False, tour__state__public=False
    ).exclude(
        talk__isnull=False, talk__state__public=False
    ).exclude(
        meeting__isnull=False, meeting__state__public=False
    ).exclude(
        session__isnull=False, session__state__public=False
    ).distinct()
    filter_class = ActivityFilter

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        limit = request.query_params.get('next')
        limit = int(limit) if limit and limit.isnumeric() and int(limit) > 0 else None
        if limit and limit > 10:
            limit = 10
        if limit:
            queryset = queryset[:limit]

        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            if limit:
                latest = list(queryset)[-1]
            else:
                latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super(ActivityViewSet, self).retrieve(request, *args, **kwargs)
        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

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

        try:
            reference = Reference.get_reference(self.kwargs[self.lookup_url_kwarg])
            obj = get_object_or_404(queryset, reference=reference)
        except Reference.DoesNotExist:
            raise Http404('No %s matches the given query.' % 'Reference')

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    class Meta:
        model = Event

