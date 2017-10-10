# -*- coding: utf-8 -*-
from rest_framework import viewsets

from server.models import Guide
from server.serializers.client import GuideSerializer, GuideListSerializer
from server.filters.client import GuideFilter


class GuideViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Guide.objects.filter(seasons__current=True, deprecated=False)
    search_fields = ('user__last_name', 'user__first_name')
    filter_class = GuideFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return GuideListSerializer
        return GuideSerializer

    class Meta:
        model = Guide
