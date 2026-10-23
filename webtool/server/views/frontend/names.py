# -*- coding: utf-8 -*-
from django.db.models.aggregates import Count
from django.template.defaultfilters import date
from rest_framework import viewsets
from rest_framework.response import Response

from server.models import Guide, Season
from server.serializers.frontend.names import NameListSerializer


class NamesViewSet(viewsets.mixins.ListModelMixin, viewsets.GenericViewSet):

    # Placeholder for the router; the real queryset is built per request.
    queryset = Guide.objects.none()

    def get_queryset(self):
        # Guides of last, this and next season (Season.visible), so an event of
        # any season in the frontend window can be assigned. The qualification
        # count goes through a subquery: joined with the season filter it would
        # be multiplied by the number of seasons.
        return (
            Guide.objects
            .filter(pk__in=Guide.objects.filter(seasons__in=Season.visible('frontend')).values('pk'))
            .exclude(deprecated=True)
            .annotate(num_qualifications=Count('user__qualification_list'))
            .exclude(num_qualifications=0)
        )

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
