# -*- coding: utf-8 -*-
import django_filters.rest_framework as django_filters
from rest_framework import serializers, viewsets
from rest_framework.reverse import reverse

from server.models import Event, Tour, Talk, Instruction, Session


class ActivityListSerializer(serializers.ModelSerializer):

    id = serializers.StringRelatedField(source='reference')
    category = serializers.CharField(source='reference.category.name')
    description = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.TimeField(source='start_time')
    endDate = serializers.DateField(source='end_date')
    guide = serializers.SerializerMethodField()
    ladiesOnly = serializers.BooleanField(source='ladies_only')
    publicTransport = serializers.BooleanField(source='public_transport')
    lowEmissionAdventure = serializers.BooleanField(source='lea')
    detail = serializers.SerializerMethodField()

    def get_description(self, obj):
        category = obj.reference.category
        if hasattr(obj, 'tour') and obj.tour:
            return (
                '<a href="/aktivitaeten/touren/details/{ref}/">'
                '<span class="category" title="{cn}">{cc}</span>'
                '<strong class="title">{n}</strong>'
                '<span class="reference">({ref})</span>'
                '</a>'.format(
                    cn=category.name, cc=category.code, n=obj.name, ref=obj.reference
                )
            )
        else:
            return "{}".format(obj.name)

    def get_guide(self, obj):
        request = self.context['request']
        guide = obj.guide
        return {
            'detail': reverse('guide-detail', kwargs={'username': guide.user.username}, request=request),
            'firstName': guide.user.first_name,
            'lastName': guide.user.last_name
        } if guide else None

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('event-detail', kwargs={'reference': str(obj.reference)}, request=request)

    class Meta:
        model = Event
        fields = (
            'id',
            'activity', 'category',
            'description',
            'startDate', 'startTime',
            'endDate',
            'quantity',
            'speaker',
            'guide',
            'division',
            'ladiesOnly', 'publicTransport', 'lowEmissionAdventure',
            'state',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'reference'}}


class ActivitySerializer(ActivityListSerializer):

    description = serializers.SerializerMethodField()
    skill = serializers.IntegerField(source='skill.order')
    fitness = serializers.IntegerField(source='fitness.order')
    cover = serializers.SerializerMethodField()
    portal = serializers.SerializerMethodField()
    map = serializers.SerializerMethodField()
    ics = serializers.SerializerMethodField()

    def get_description(self, obj):
        return "Das ist ein langer <b>formartierter</b> Text..."

    def get_cover(self, obj):
        return None

    def get_portal(self, obj):
        return None

    def get_map(self, obj):
        return None

    def get_ics(self, obj):
        return None

    class Meta(ActivityListSerializer.Meta):
        fields = (
            'id',
            'activity', 'category',
            'description',
            'startDate', 'startTime',
            'endDate',
            'quantity',
            'speaker',
            'guide',
            'division',
            'skill',
            'fitness',
            'ladiesOnly', 'publicTransport', 'lowEmissionAdventure',
            'state',
            'cover', 'portal', 'map', 'ics'
        )
