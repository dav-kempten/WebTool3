# -*- coding: utf-8 -*-
from decimal import Decimal

from rest_framework import serializers


class MoneyField(serializers.DecimalField):

    def __init__(self, source=None, default=None):

        if default is None:
            default = Decimal('0.00')

        super(self.__class__, self).__init__(
            source=source,
            decimal_places=2,
            max_digits=6,
            default=default,
        )


class GuideSerializer(serializers.Serializer):

    id = serializers.IntegerField(source='pk')


class QualificationSerializer(serializers.Serializer):

    id = serializers.IntegerField(source='pk')


class EquipmentSerializer(serializers.Serializer):

    id = serializers.IntegerField(source='pk')


class EventSerializer(serializers.Serializer):

    id = serializers.IntegerField(source='pk')
    title = serializers.CharField(default='', allow_blank=True)
    name = serializers.CharField(default='', allow_blank=True)
    description = serializers.CharField(default='', allow_blank=True)
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.TimeField(source="start_time", default=None, allow_null=True)
    approximateId = serializers.IntegerField(source='approximate_Id', default=None, allow_null=True)
    endDate = serializers.DateField(source="end_date", default=None, allow_null=True)
    endTime = serializers.TimeField(source="end_time", default=None, allow_null=True)
    rendezvous = serializers.CharField(default='', allow_blank=True)
    location = serializers.CharField(default='', allow_blank=True)
    source = serializers.CharField(default='', allow_blank=True)
    link = serializers.CharField(default='', allow_blank=True)
    map = serializers.CharField(default='', allow_blank=True)
    distal = serializers.BooleanField(default=False)
    distance = serializers.IntegerField(default=0)
    publicTransport = serializers.BooleanField(source='public_transport', default=False)
    lowEmissionAdventure = serializers.BooleanField(source='lea', default=False)
