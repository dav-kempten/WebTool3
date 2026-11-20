# -*- coding: utf-8 -*-
import json

from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import Guide

EDITABLE_PROFILE_KEYS = ('name', 'city', 'job', 'hobby', 'reason', 'tip')

PROFILE_MAX_LENGTHS = {
    'name': 100,
    'city': 150,
    'job': 250,
    'hobby': 1000,
    'reason': 2000,
    'tip': 1000,
}


class GuideProfileField(serializers.Field):
    """
    Exposes Guide.profile as a flat dict of the editable Steckbrief fields
    while still accepting JSON-encoded strings for backwards compatibility.
    """

    def get_attribute(self, instance):
        # Always return a dict so DRF does not short-circuit None to null.
        return instance.parsed_profile()

    def to_representation(self, value):
        parsed = value if isinstance(value, dict) else {}
        return {
            key: parsed[key] if isinstance(parsed.get(key), str) else ''
            for key in EDITABLE_PROFILE_KEYS
        }

    def to_internal_value(self, data):
        if data is None:
            return {}
        if isinstance(data, str):
            if not data.strip():
                return {}
            try:
                data = json.loads(data)
            except (TypeError, ValueError):
                raise serializers.ValidationError('Ungültiges JSON im Steckbrief.')
        if not isinstance(data, dict):
            raise serializers.ValidationError('Der Steckbrief muss ein JSON-Objekt sein.')

        cleaned = {}
        errors = {}
        for key in EDITABLE_PROFILE_KEYS:
            if key not in data:
                continue
            val = data[key]
            if val is None:
                cleaned[key] = ''
                continue
            if not isinstance(val, str):
                errors[key] = 'Bitte einen Text angeben.'
                continue
            stripped = val.strip()
            limit = PROFILE_MAX_LENGTHS[key]
            if len(stripped) > limit:
                errors[key] = f'Maximal {limit} Zeichen erlaubt.'
                continue
            cleaned[key] = stripped

        if errors:
            raise serializers.ValidationError(errors)
        return cleaned


class GuideListSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    userName = serializers.CharField(source='user.username', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    job = serializers.SerializerMethodField()
    hasProfile = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'userName',
            'firstName',
            'lastName',
            'job',
            'hasProfile',
            'url',
        )

    def get_job(self, obj):
        val = obj.parsed_profile().get('job')
        return val if isinstance(val, str) else ''

    def get_hasProfile(self, obj):
        parsed = obj.parsed_profile()
        return any(
            isinstance(parsed.get(key), str) and bool(parsed[key].strip())
            for key in EDITABLE_PROFILE_KEYS
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('guides-detail', args=[obj.pk], request=request)


class GuideSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    userName = serializers.CharField(source='user.username', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    profile = GuideProfileField(required=False, allow_null=True)

    class Meta:
        model = Guide
        fields = (
            'id',
            'userName',
            'firstName',
            'lastName',
            'profile',
        )

    def update(self, instance, validated_data):
        incoming = validated_data.get('profile')
        if incoming is not None:
            current = instance.parsed_profile()
            for key, val in incoming.items():
                if val:
                    current[key] = val
                else:
                    current.pop(key, None)
            # Keep storing a JSON string, matching existing production rows and
            # any consumer that reads Guide.profile via json.loads().
            instance.profile = json.dumps(current, ensure_ascii=False) if current else None
            instance.save()
        return instance