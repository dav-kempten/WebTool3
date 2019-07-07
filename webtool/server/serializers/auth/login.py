# -*- coding: utf-8 -*-
from django.contrib.auth.models import User
from rest_framework import serializers

from server.models import Profile


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField(allow_blank=True)
    password = serializers.CharField(allow_blank=True)
    member_id = serializers.CharField(allow_blank=True)

    def validate(self, data):

        try:
            profile = Profile.objects.get(member_id=data['member_id'])
            user = profile.user
        except Profile.DoesNotExist:
            try:
                user = User.objects.get(username=data['username'])
            except User.DoesNotExist:
                raise serializers.ValidationError('unknown user')

        return data
