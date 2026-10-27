# -*- coding: utf-8 -*-
from rest_framework import serializers


class RequirementEntrySerializer(serializers.Serializer):
    """Eine Zeile der Bedarfsanzeige: Bedarf und Ist-Stand einer Art.

    `id` ist None, wenn für die Art kein Bedarf gepflegt ist und sie nur wegen
    bereits eingestellter Veranstaltungen auftaucht.
    """

    id = serializers.IntegerField(read_only=True, allow_null=True)
    categoryId = serializers.IntegerField(read_only=True)
    code = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    minimum = serializers.IntegerField(read_only=True)
    maximum = serializers.IntegerField(read_only=True)
    actual = serializers.IntegerField(read_only=True)


class RequirementGroupSerializer(serializers.Serializer):

    kind = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    minimum = serializers.IntegerField(read_only=True)
    maximum = serializers.IntegerField(read_only=True)
    actual = serializers.IntegerField(read_only=True)
    entries = RequirementEntrySerializer(many=True, read_only=True)
    # Arten ohne Bedarfsvorgabe, in denen trotzdem etwas eingestellt ist.
    unplanned = RequirementEntrySerializer(many=True, read_only=True)


class RequirementSectionSerializer(serializers.Serializer):
    """Winter, Sommer oder ganzjährig -- in der Anzeige je ein Aufklapper."""

    part = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    minimum = serializers.IntegerField(read_only=True)
    maximum = serializers.IntegerField(read_only=True)
    actual = serializers.IntegerField(read_only=True)
    groups = RequirementGroupSerializer(many=True, read_only=True)


class RequirementOverviewSerializer(serializers.Serializer):

    season = serializers.CharField(read_only=True)
    # Das gezählte Programmjahr, beide Tage eingeschlossen.
    periodStart = serializers.DateField(read_only=True)
    periodEnd = serializers.DateField(read_only=True)
    sections = RequirementSectionSerializer(many=True, read_only=True)
