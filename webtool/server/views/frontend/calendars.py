# -*- coding: utf-8 -*-
from django.http import Http404
from django.template.defaultfilters import date

from rest_framework import viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from server.models import Calendar
from server.serializers.frontend.calendars import CalendarListSerializer, CalendarSerializer


class CalendarsViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Calendar.objects.filter(deprecated=False)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = CalendarListSerializer(queryset, many=True, context={'request': request})
        response = Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        if queryset.exists():
            latest = queryset.latest()
            response['ETag'] = '"{}"'.format(latest.get_etag())
            response['Last-Modified'] = "{} GMT".format(date(latest.updated, "D, d M Y H:i:s"))
        return response

    def retrieve(self, request, pk=None, *args, **kwargs):

        try:
            pk = int(pk)
        except ValueError:
            raise Http404

        queryset = self.get_queryset()
        instance = get_object_or_404(queryset, pk=pk)
        serializer = CalendarSerializer(instance)

        response = Response(serializer.data)
        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response

    class Meta:
        model = Calendar
