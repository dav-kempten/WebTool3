# -*- coding: utf-8 -*-
import django_filters.rest_framework as django_filters
from rest_framework import serializers, viewsets
from rest_framework.reverse import reverse

from server.models import Topic


class TopicListSerializer(serializers.ModelSerializer):

    id = serializers.CharField(source='category.code')
    detail = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = (
            'id',
            'name',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'code'}}

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('topic-detail', kwargs={'code': obj.category.code}, request=request)


class TopicSerializer(TopicListSerializer):

    links = serializers.SerializerMethodField()

    class Meta(TopicListSerializer.Meta):
        fields = (
            'id',
            'name',
            'description',
            'cover',
            'links'
        )

    def get_links(self, obj):
        request = self.context['request']
        result = {
            'instructions': None,
        }

        if obj.instructions.exists():
            result["instructions"] = "{}?category={}".format(reverse('event-list', request=request), obj.category.code)

        return result
