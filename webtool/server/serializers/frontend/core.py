# -*- coding: utf-8 -*-
from decimal import Decimal

from rest_framework import serializers

from server.models import Event, Approximate, Reference


class MoneyField(serializers.DecimalField):

    def __init__(self, source=None, default=None, read_only=False):

        if default is None:
            default = Decimal('0.00')

        super(self.__class__, self).__init__(
            source=source,
            decimal_places=2,
            max_digits=6,
            default=default,
            read_only=read_only
        )


def update_event(instance, validated_data, context):
    delete_request = validated_data.pop('deprecated', False)
    if not delete_request:
        instance.title = validated_data.get('title', instance.title)
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.start_time = validated_data.get('start_time', instance.start_time)
        instance.approximate_id = validated_data.get('approximate', instance.approximate_id)
        instance.end_date = validated_data.get('end_date', instance.end_date)
        instance.end_time = validated_data.get('end_time', instance.end_time)
        instance.rendezvous = validated_data.get('rendezvous', instance.rendezvous)
        instance.location = validated_data.get('location', instance.location)
        instance.reservation_service = validated_data.get('reservation_service', instance.reservation_service)
        instance.lea = validated_data.get('lea', instance.lea)
        instance.source = validated_data.get('source', instance.source)
        instance.link = validated_data.get('link', instance.link)
        instance.map = validated_data.get('map', instance.map)
        instance.distal = validated_data.get('distal', instance.distal)
        instance.distance = validated_data.get('distance', instance.distance)
        instance.public_transport = validated_data.get('public_transport', instance.public_transport)
        instance.shuttle_service = validated_data.get('shuttle_service', instance.shuttle_service)
        instance.save()
    else:
        reference = instance.reference
        if reference:
            reference.deprecated = True
            reference.save()
        instance.instruction = None
        instance.deprecated = True
        instance.save()
    return instance


# context = {"category": <category>, "type": <event_type>, "season": <season>}
#
# creating a instruction
# - category is a topic category
# - type = {"topic": True}
#
# creating a additional meeting for an instruction
# - category is None
# - type = {"meeting": True}
#
# creating a tour
# - category is a tour category
# - season = category.seasons.get(current=True)
# - type = {"tour": True}
#
# creating a deadline for a tour
# - category is None
# - type = {"deadline": True}
#
# creating a preliminary for a tour
# - category is None
# - type = {"preliminary": True}
#
# creating a session
# - category is a collective category
# - type = {"collective": True}
#
# creating a talk
# - category is a talk category
# - type = {"talk": True}

def create_event(validated_data, context):
    instance = validated_data.pop('pk')
    if instance:
        return update_event(instance, validated_data, context)
    else:
        validated_data.pop('deprecated')
        category = context.get('category')
        event_type = context.get('type', {})
        season = context.get('season')
        start_date = validated_data.get('start_date')
        reference = Reference.create_reference(
            category=category,
            prefix=str(start_date.year)[-1] if start_date else season.name[-1],
            season=season,
            **event_type
        )
        return Event.objects.create(season=season, reference=reference, **validated_data)


class EventSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=Event.objects.all(), default=None, allow_null=True
    )
    deprecated = serializers.BooleanField(write_only=True, default=False)
    title = serializers.CharField(max_length=30, default='', allow_blank=True)
    name = serializers.CharField(max_length=125, default='', allow_blank=True)
    description = serializers.CharField(default='', allow_blank=True)
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.TimeField(format="%H:%M", source="start_time", default=None, allow_null=True)
    approximateId = serializers.PrimaryKeyRelatedField(
        source='approximate', default=None, allow_null=True, queryset=Approximate.objects.all()
    )
    endDate = serializers.DateField(source="end_date", default=None, allow_null=True)
    endTime = serializers.TimeField(format="%H:%M", source="end_time", default=None, allow_null=True)
    rendezvous = serializers.CharField(max_length=75, default='', allow_blank=True)
    location = serializers.CharField(max_length=75, default='', allow_blank=True)
    reservationService = serializers.BooleanField(source='reservation_service', default=False)
    lea = serializers.BooleanField(default=False)
    source = serializers.CharField(max_length=75, default='', allow_blank=True)
    link = serializers.CharField(max_length=200, default='', allow_blank=True)
    map = serializers.CharField(max_length=100, default='', allow_blank=True)
    distal = serializers.BooleanField(default=False)
    distance = serializers.IntegerField(default=0)
    publicTransport = serializers.BooleanField(source='public_transport', default=False)
    shuttleService = serializers.BooleanField(source='shuttle_service', default=False)

    class Meta:
        model = Event
        fields = (
            'id', 'deprecated',
            'title', 'name', 'description',
            'startDate', 'startTime', 'approximateId',
            'endDate', 'endTime',
            'rendezvous', 'location', 'reservationService', 'lea', 'source',
            'link', 'map',
            'distal', 'distance', 'publicTransport', 'shuttleService'
        )

    def validate(self, data):
        instance_data = data.get('pk')
        if (instance_data is not None) or (self.instance is not None):
            # This is the Update case

            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")

            if self.instance is not None:
                if instance_data.pk != self.instance.pk:
                    raise serializers.ValidationError("Wrong instance Id")

            delete_request = data.get('deprecated', False)
            event_category = instance_data.reference.category
            if (
                (event_category.tour or event_category.topic or event_category.collective or event_category.talk)
                and delete_request
            ):
                raise serializers.ValidationError(f"Event with id '{instance_data.pk}' cannot be deleted")

        return data

    def create(self, validated_data):
        return create_event(validated_data, self.context)

    def update(self, instance, validated_data):
        return update_event(instance, validated_data, self.context)
