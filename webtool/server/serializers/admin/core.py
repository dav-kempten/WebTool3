# -*- coding: utf-8 -*-

from rest_framework import serializers


class MeetingSerializer(serializers.Serializer):

    title = serializers.CharField(allow_blank=True, allow_null=True, default='')
    name = serializers.CharField(allow_blank=True, allow_null=True, default='')
    description = serializers.CharField(allow_blank=True, default='')
    startDate = serializers.DateField(source="start_date")
    startTime = serializers.TimeField(source="start_time", default=None, allow_null=True)
    approximate = serializers.CharField(default=None, allow_null=True)
    endDate = serializers.DateField(source="end_date", default=None, allow_null=True)
    endTime = serializers.TimeField(source="end_time", default=None, allow_null=True)
    rendezvous = serializers.CharField(allow_blank=True, default='')
    location = serializers.CharField(allow_blank=True, default='')
    source = serializers.CharField(allow_blank=True, default='')
    link = serializers.CharField(allow_blank=True, default='')
    map = serializers.CharField(allow_blank=True, default='')
    distal = serializers.BooleanField(default=False)
    distance = serializers.IntegerField(default=0)
    publicTransport = serializers.BooleanField(source="public_transport", default=False)
    reference = serializers.CharField(default=None, allow_null=True)


class QuantitySerializer(serializers.Serializer):

    min = serializers.IntegerField(source="min_quantity", default=3)
    max = serializers.IntegerField(source="max_quantity", default=6)
    current = serializers.IntegerField(source="cur_quantity")


