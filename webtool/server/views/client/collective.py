# -*- coding: utf-8 -*-
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from server.models import Collective, Season
from server.serializers.client import CollectiveSerializer, CollectiveListSerializer
from server.filters.client import CollectiveFilter


class CollectiveViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "category__code"
    lookup_url_kwarg = "code"
    filterset_class = CollectiveFilter
    filter_backends = [DjangoFilterBackend]

    # Placeholder for the router; the real queryset depends on the current season
    # and is built per request in get_queryset.
    queryset = Collective.objects.none()

    def get_queryset(self):
        # The client API shows this and next season (Season.visible).
        return Collective.objects.exclude(deprecated=True).filter(seasons__in=Season.visible('client')).distinct()
    search_fields = ('name',)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response = Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super(CollectiveViewSet, self).retrieve(request, *args, **kwargs)
        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    def get_serializer_class(self):
        if self.action == 'list':
            return CollectiveListSerializer
        return CollectiveSerializer

    class Meta:
        model = Collective
