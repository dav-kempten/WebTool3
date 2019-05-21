# -*- coding: utf-8 -*-
from django.db.models.aggregates import Count
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Guide
from server.serializers.frontend.names import NameListSerializer


class NamesViewSet(viewsets.mixins.ListModelMixin, viewsets.GenericViewSet):

    queryset = Guide.objects\
        .filter(seasons__current=True)\
        .exclude(deprecated=True)\
        .annotate(num_qualifications=Count('user__qualification_list'))\
        .exclude(num_qualifications=0)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = NameListSerializer(queryset, many=True)
        response =  Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    class Meta:
        model = Guide
