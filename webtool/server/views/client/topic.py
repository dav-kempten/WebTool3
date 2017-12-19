# -*- coding: utf-8 -*-
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Topic
from server.serializers.client import TopicSerializer, TopicListSerializer
from server.filters.client import TopicFilter


class TopicViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "category__code"
    lookup_url_kwarg = "code"

    queryset = Topic.objects.filter(seasons__current=True).exclude(deprecated=True)
    search_fields = ('name',)
    filter_class = TopicFilter

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
        response = super(TopicViewSet, self).retrieve(request, *args, **kwargs)
        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    def get_serializer_class(self):
        if self.action == 'list':
            return TopicListSerializer
        return TopicSerializer

    class Meta:
        model = Topic
