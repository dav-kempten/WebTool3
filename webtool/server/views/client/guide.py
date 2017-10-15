# -*- coding: utf-8 -*-
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Guide
from server.serializers.client import GuideSerializer, GuideListSerializer
from server.filters.client import GuideFilter


class GuideViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Guide.objects.filter(seasons__current=True, deprecated=False)
    search_fields = ('user__last_name', 'user__first_name')
    filter_class = GuideFilter

    def list(self, request, *args, **kwargs):
        response = super(GuideViewSet, self).list(request, *args, **kwargs)
        latest = Guide.objects.latest()
        response['Cache-Control'] = "public"
        response['ETag'] = '"{}"'.format(latest.get_etag())
        response['Last-Modified'] = date(latest.updated, "%D, %d %M %Y %H:%i:%s GMT")
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super(GuideViewSet, self).retrieve(request, *args, **kwargs)
        response['Cache-Control'] = "public"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = date(instance.updated, "%D, %d %M %Y %H:%i:%s GMT")
        return response

    def get_serializer_class(self):
        if self.action == 'list':
            return GuideListSerializer
        return GuideSerializer

    class Meta:
        model = Guide

