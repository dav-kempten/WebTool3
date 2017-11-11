# -*- coding: utf-8 -*-
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Guide
from server.serializers.client import GuideSerializer, GuideListSerializer
from server.filters.client import GuideFilter


class GuideViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "user__username"
    lookup_url_kwarg = "username"

    queryset = Guide.objects.filter(seasons__current=True).exclude(deprecated=True)
    search_fields = ('user__last_name', 'user__first_name')
    filter_class = GuideFilter

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response =  Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super(GuideViewSet, self).retrieve(request, *args, **kwargs)
        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    def get_serializer_class(self):
        if self.action == 'list':
            return GuideListSerializer
        return GuideSerializer

    class Meta:
        model = Guide

