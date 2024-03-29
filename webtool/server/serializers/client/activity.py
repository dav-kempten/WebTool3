# -*- coding: utf-8 -*-
import django_filters.rest_framework as django_filters
from rest_framework import serializers, viewsets
from rest_framework.reverse import reverse

from server.models import Event, Tour, Talk, Instruction, Session


class ActivityListSerializer(serializers.ModelSerializer):

    id = serializers.StringRelatedField(source='reference')
    category = serializers.CharField(source='reference.category.name')
    categories = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='start_date')
    startTime = serializers.SerializerMethodField()
    endDate = serializers.DateField(source='end_date')
    guide = serializers.SerializerMethodField()
    ladiesOnly = serializers.BooleanField(source='ladies_only')
    youthOnTour = serializers.BooleanField(source='youth_on_tour')
    relaxed = serializers.BooleanField()
    mountainBus = serializers.BooleanField(source='mountain_bus')
    kvLink = serializers.URLField(source='kv_link')
    publicTransport = serializers.BooleanField(source='public_transport')
    lowEmissionAdventure = serializers.BooleanField(source='lea')
    detail = serializers.SerializerMethodField()

    def get_categories(self, obj):
        categories = [obj.reference.category.name]
        if obj.youth_on_tour:
            categories = ['Jugend'] + categories
        if obj.ladies_only:
            categories = ['Frauen'] + categories
        if obj.relaxed:
            categories = ['Geh\'mütlich'] + categories
        if obj.mountain_bus:
            categories = ['Bergbus'] + categories
        if hasattr(obj, 'tour') and obj.tour:
            categories.extend(obj.tour.categories.values_list('name', flat=True))
        elif hasattr(obj, 'session') and obj.session:
            categories.extend(obj.session.categories.values_list('name', flat=True))
        elif hasattr(obj, 'meeting') and obj.meeting and obj.meeting.category:
            categories.append(obj.meeting.category.name)

        return categories

    def get_description(self, obj):
        return obj.subject

    def get_title(self, obj):
        if hasattr(obj, 'meeting') and obj.meeting:
            if obj.meeting.is_special:
                return obj.title
            else:
                return obj.meeting.topic.name
        else:
            return obj.title

    def get_startTime(self, obj):
        if obj.start_time is None:
            return obj.approximate.name if obj.approximate else None
        else:
            return obj.start_time

    def get_guide(self, obj):
        request = self.context['request']
        if hasattr(obj, 'session') and obj.session:
            return None
        else:
            guide = obj.guide
            return {
                'id': guide.user.get_username(),
                'detail': reverse('guides-detail', kwargs={'username': guide.user.username}, request=request),
                'firstName': guide.user.first_name,
                'lastName': guide.user.last_name
            } if guide else None

    def get_detail(self, obj):
        request = self.context['request']
        # if obj.reference.category.code == "SKA":
        #     return None
        return reverse('activities-detail', kwargs={'reference': str(obj.reference)}, request=request)

    class Meta:
        model = Event
        fields = (
            'id',
            'activity', 'category', 'categories',
            'description',
            'title',
            'startDate', 'startTime',
            'endDate',
            'quantity',
            'speaker',
            'guide',
            'division',
            'skill',
            'fitness',
            'ladiesOnly', 'youthOnTour', 'relaxed', 'mountainBus',
            'kvLink',
            'publicTransport', 'lowEmissionAdventure',
            'state',
            'new',
            'detail'
        )
        extra_kwargs = {'id': {'lookup_field': 'reference'}}


class ActivitySerializer(ActivityListSerializer):

    description = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    portal = serializers.SerializerMethodField()
    map = serializers.SerializerMethodField()
    ics = serializers.SerializerMethodField()

    def get_description(self, obj):
        return obj.details

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
            'activity', 'category', 'categories',
            'description',
            'title',
            'startDate', 'startTime',
            'endDate',
            'quantity',
            'admission',
            'speaker',
            'guide',
            'division',
            'skill',
            'fitness',
            'preconditions',
            'equipments',
            'ladiesOnly', 'youthOnTour', 'relaxed', 'mountainBus',
            'kvLink',
            'publicTransport', 'lowEmissionAdventure',
            'state',
            'new',
            'cover', 'portal', 'map', 'ics'
        )
