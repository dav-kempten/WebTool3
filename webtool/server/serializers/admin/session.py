# -*- coding: utf-8 -*-

from rest_framework.reverse import reverse
from rest_framework import serializers

from server.models import Event, Collective, Session, Guide, Equipment, State, Skill, Fitness, Category
from server.models.utils import create_reference

from .core import MeetingSerializer


class SessionSerializer(MeetingSerializer):

    collective = serializers.CharField(source='session.collective.category.code')
    categories = serializers.CharField(source='session.categories', allow_blank=True, default=None)
    miscCategory = serializers.CharField(source='session.misc_category', allow_blank=True, default='')
    ladiesOnly = serializers.BooleanField(source="session.ladies_only", default=False)
    lowEmissionAdventure = serializers.BooleanField(source="lea", default=False)
    state = serializers.IntegerField(source="session.state.order", default=0, min_value=0)
    guide = serializers.CharField(source="session.guide.user.username", allow_null=True, default=None)
    team = serializers.CharField(source="session.team", allow_blank=True, default='')
    speaker = serializers.CharField(source="session.speaker", allow_null=True, default=None)
    message = serializers.CharField(source="session.message", allow_blank=True, default='')
    comment = serializers.CharField(source="session.comment", allow_blank=True, default='')
    equipments = serializers.CharField(source="session.equipments", allow_blank=True, default='')
    misc_equipment = serializers.CharField(source="session.misc_equipment", allow_blank=True, default='')
    skill = serializers.IntegerField(source="session.skill.order", default=1, min_value=1, max_value=3)
    fitness = serializers.IntegerField(source="session.fitness.order", default=1, min_value=1, max_value=3)

    def create(self, validated_data):
        reference = validated_data.pop('reference')
        assert reference is None
        session = validated_data.pop('session')

        guide = None
        username = session.pop('guide').pop('user').pop('username')
        if isinstance(username, str):
            guide = Guide.objects.get(user__username=username)

        guide_list = None
        team = session.pop('team').split(', ')
        if isinstance(team, str):
            guide_list = Guide.objects.filter(user__username__in=team)
            if guide_list.count() != len(team):
                pass

        speaker = session.pop('speaker')
        if speaker is None:
            speaker = ''

        equipment_list = None
        equipments = session.pop('equipments')
        if isinstance(equipments, str):
            equipment_list = Equipment.objects.filter(code__in=equipments.split(', '))

        category_list = None
        categories = session.pop('categories')
        if isinstance(categories, str):
            category_list = Category.objects.filter(code__in=categories.split(', '))

        category = session.pop('collective').pop('category').pop('code')
        start_date = validated_data.get('start_date')
        prefix = str(start_date.year)[-1]
        reference = create_reference(category, prefix=prefix, collective=True)
        category = reference.category
        season = reference.season

        state = session.pop('state').pop('order')
        state = State.objects.get(seasons=season, order=5)

        skill = session.pop('skill').pop('order')
        skill = Skill.objects.get(seasons=season, order=skill)

        fitness = session.pop('fitness').pop('order')
        fitness = Fitness.objects.get(seasons=season, order=fitness)

        collective = Collective.objects.get(seasons=season, category=category)
        event = Event.objects.create(season=season, reference=reference, new=True, **validated_data)
        session = Session.objects.create(
            collective=collective, guide=guide, session=event, state=state, fitness=fitness, skill=skill, speaker=speaker, **session
        )

        if guide_list:
            session.team = team

        if equipment_list:
            session.equipments = equipment_list

        if category_list:
            session.categories = category_list

        return session


class SessionListSerializer(serializers.Serializer):

    reference = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    start_date = serializers.DateField(read_only=True)
    end_date = serializers.DateField(allow_null=True, default=None, read_only=True)
    detail = serializers.SerializerMethodField(read_only=True)

    def get_detail(self, obj):
        request = self.context['request']
        return reverse('session-detail', kwargs={'reference': str(obj.reference)}, request=request)
