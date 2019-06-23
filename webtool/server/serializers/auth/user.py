# -*- coding: utf-8 -*-
from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'firstName', 'lastName',
            'role'
        )

    def get_role(self, user):
        role = ''
        if user:
            if user.is_superuser:
                role = 'administrator'
            elif user.is_staff:
                role = 'staff'
            # elif user.qualification_list.count() > 0:
            #    role = 'coordinator'
            elif user.qualification_list.count() > 0:
                role = 'guide'
        return role
