# -*- coding: utf-8 -*-
import django_filters.rest_framework as django_filters
from rest_framework import serializers, viewsets
from rest_framework.reverse import reverse

from server.models import Collective


class CollectiveListSerializer(serializers.ModelSerializer):

    id = serializers.CharField(source='category.code')
    detail = serializers.SerializerMethodField()

    class Meta:
        model = Collective
        fields = (
            'id',
            'name',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'code'}}

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('collective-detail', kwargs={'code': obj.category.code}, request=request)


class CollectiveSerializer(CollectiveListSerializer):

    ics = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta(CollectiveListSerializer.Meta):
        fields = (
            'id',
            'name',
            'description',
            'cover',
            'ics',
            'links'
        )

    def get_ics(self, obj):
        return None

    def get_links(self, obj):
        request = self.context['request']
        result = {
            'sessions': None,
        }

        if obj.session_list.exists():
            result["sessions"] = "{}?category={}".format(reverse('event-list', request=request), obj.category.code)

        return result
