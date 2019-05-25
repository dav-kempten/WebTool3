# -*- coding: utf-8 -*-
from decimal import Decimal

from rest_framework import serializers

from server.models import Event, Approximate


class MoneyField(serializers.DecimalField):

    def __init__(self, source=None, default=None, read_only=None):

        if default is None:
            default = Decimal('0.00')

        super(self.__class__, self).__init__(
            source=source,
            decimal_places=2,
            max_digits=6,
            default=default,
            read_only=read_only
        )


class EventSerializer(serializers.Serializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Event.objects.all())

    deprecated = serializers.BooleanField(write_only=True, default=False)

    title = serializers.CharField(default='', allow_blank=True)
    name = serializers.CharField(default='', allow_blank=True)
    description = serializers.CharField(default='', allow_blank=True)
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.TimeField(source="start_time", default=None, allow_null=True)
    approximateId = serializers.PrimaryKeyRelatedField(
        source='approximate', default=None, allow_null=True, queryset=Approximate.objects.all()
    )
    endDate = serializers.DateField(source="end_date", default=None, allow_null=True)
    endTime = serializers.TimeField(source="end_time", default=None, allow_null=True)
    rendezvous = serializers.CharField(default='', allow_blank=True)

    location = serializers.CharField(default='', allow_blank=True)
    reservationService = serializers.BooleanField(source='reservation_service', default=False)

    source = serializers.CharField(default='', allow_blank=True)
    link = serializers.CharField(default='', allow_blank=True)
    map = serializers.CharField(default='', allow_blank=True)

    distal = serializers.BooleanField(default=False)
    distance = serializers.IntegerField(default=0)
    publicTransport = serializers.BooleanField(source='public_transport', default=False)
    shuttleService = serializers.BooleanField(source='shuttle_service', default=False)
