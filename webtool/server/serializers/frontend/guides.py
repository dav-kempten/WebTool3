# -*- coding: utf-8 -*-
from django.contrib.auth.models import User, Group, Permission
from rest_framework.reverse import reverse
from rest_framework import serializers
from server.models import Guide


class GuideListSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    userName = serializers.CharField(source='user.username', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'userName',
            'firstName',
            'lastName',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('guides-detail', args=[obj.pk], request=request)


class GuideSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    userName = serializers.CharField(source='user.username', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    profile = serializers.JSONField(read_only=True)

    class Meta:
        model = Guide
        fields = (
            'id',
            'userName',
            'firstName',
            'lastName',
            'profile',
        )

    # def validate(self, data):
    # def create(self, validated_data):
    # def update(self, instance, validated_data):