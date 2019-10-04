# -*- coding: utf-8 -*-
from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import (
    Session, Collective, Category, Equipment, State, Event, get_default_state, get_default_season
)
from server.serializers.frontend.core import EventSerializer, create_event, update_event


class SessionListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    reference = serializers.CharField(source='session.reference.__str__', read_only=True)
    title = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='session.start_date', read_only=True)
    speaker = serializers.CharField(default=None, read_only=True)
    ladiesOnly = serializers.BooleanField(source='ladies_only', read_only=True)
    stateId = serializers.PrimaryKeyRelatedField(source='state_id', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            'id',
            'reference',
            'title',
            'startDate',
            'speaker',
            'ladiesOnly',
            'stateId',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('sessions-detail', args=[obj.pk], request=request)

    def get_title(self, obj):
        return obj.session.title

class SessionSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Session.objects.all(), default=None, allow_null=True)
    reference = serializers.CharField(source='session.reference.__str__', read_only=True)

    speaker = serializers.CharField(default=None, allow_blank=True, allow_null=True)

    collectiveId = serializers.PrimaryKeyRelatedField(source='collective', queryset=Collective.objects.all())
    session = EventSerializer(default={})
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    categoryIds = serializers.PrimaryKeyRelatedField(
        source='categories', many=True, default=[], queryset=Category.objects.all()
    )
    misc_category = serializers.CharField(default=None, allow_null=True, allow_blank=True)

    equipmentIds = serializers.PrimaryKeyRelatedField(
        source='equipments', many=True, default=[], queryset=Equipment.objects.all()
    )
    miscEquipment = serializers.CharField(source='misc_equipment', max_length=75, default='', allow_blank=True,
                                          allow_null=True)

    stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())

    class Meta:
        model = Session
        fields = (
            'id', 'reference',
            'speaker',
            'collectiveId',
            'session',
            'ladiesOnly',
            'categoryIds', 'misc_category',
            'equipmentIds', 'miscEquipment',
            'stateId',
        )

    def validate(self, data):
        print(self.instance)
        if self.instance is not None:
            # This is the Update case

            session = self.instance

            instance_data = data.get('pk')
            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != session.pk:
                raise serializers.ValidationError("Wrong instance Id")

            session_data = data.get('session')
            if session_data is not None:
                session_instance = session_data.get('pk')
                if session_instance is None:
                    raise serializers.ValidationError("session Id is missing")
                elif session_instance.pk != session.session_id:
                    raise serializers.ValidationError("Wrong meeting Id")

        return data

    def create(self, validated_data):
        instance = validated_data.pop('pk')
        if instance:
            return self.update(instance, validated_data)
        else:
            speaker_data = validated_data.pop('speaker')
            session_data = validated_data.pop('session')
            equipments = validated_data.pop('equipments')
            state = validated_data.pop('state', get_default_state())
            collective = validated_data.get('collective')
            category = collective.category
            season = get_default_season()
            event = create_event(session_data, dict(category=category, season=season, type=dict(collective=True)))

            if not speaker_data:
                # speaker = collective.managers
                speaker = ""
            else:
                speaker = speaker_data

            session = Session.objects.create(session=event, state=state, speaker=speaker, **validated_data)
            session.equipments = equipments
            return session

    def update(self, instance, validated_data):
        instance.speaker = validated_data.get('speaker', instance.speaker)
        session_data = validated_data.get('session')
        if session_data is not None:
            session = Event.objects.get(pk=session_data.get('pk'))
            update_event(session, session_data, self.context)
        instance.ladies_only = validated_data.get('ladies_only', instance.ladies_only)
        equipments = validated_data.get('equipments')
        if equipments is not None:
            instance.equipments = equipments
        instance.misc_equipment = validated_data.get('misc_equipment', instance.misc_equipment)
        instance.state = validated_data.get('state', instance.state)
        instance.save()
        return instance