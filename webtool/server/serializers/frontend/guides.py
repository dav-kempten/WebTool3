# -*- coding: utf-8 -*-
from django.contrib.auth.models import User, Group, Permission
from rest_framework.reverse import reverse
from rest_framework import serializers
from server.models import Guide, Profile, Retraining


class GuideListSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    username = serializers.PrimaryKeyRelatedField(source='user.username',read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    emailUser = serializers.EmailField(source='user.email', read_only=True)
    memberId = serializers.CharField(source='user.profile.member_id', read_only=True)
    birthDate = serializers.DateField(source='user.profile.birth_date', read_only=True)
    portrait = serializers.FileField(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'username',
            'firstName', 'lastName',
            'emailUser',
            'memberId',
            'birthDate',
            'portrait',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('guides-detail', args=[obj.pk], request=request)

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('name',)

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('name',)

class ProfileSerializer(serializers.ModelSerializer):
    memberId = serializers.CharField(source='member_id', read_only=True)
    sex = serializers.IntegerField(read_only=True)
    birthDate = serializers.DateField(source='birth_date', read_only=True)
    note = serializers.CharField(read_only=True)
    memberYear = serializers.IntegerField(source='member_year', read_only=True)
    integralMember = serializers.BooleanField(source='integral_member', read_only=True)
    memberHome = serializers.CharField(source='member_home', read_only=True)

    class Meta:
        model = Profile
        fields = ('memberId', 'sex',
                  'birthDate',
                  'note',
                  'memberYear',
                  'integralMember',
                  'memberHome',)


class UserSerializer(serializers.ModelSerializer):
    username = serializers.PrimaryKeyRelatedField(read_only=True)
    firstName = serializers.CharField(source='first_name', read_only=True)
    lastName = serializers.CharField(source='last_name', read_only=True)
    email = serializers.EmailField(read_only=True)
    groups = GroupSerializer()
    permissions = PermissionSerializer(source='user_permissions')
    isStaff = serializers.BooleanField(source='is_staff', read_only=True)
    isActive = serializers.BooleanField(source='is_active', read_only=True)
    dateJoined = serializers.DateTimeField(source='date_joined', read_only=True)
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ('username',
                  'firstName',
                  'lastName',
                  'email',
                  'groups',
                  'permissions',
                  'isStaff',
                  'isActive',
                  'dateJoined',
                  'profile')

class GuideSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    user = UserSerializer()
    profile = serializers.JSONField(read_only=True)
    qualifications = serializers.CharField(source='qualification_list', read_only=True)
    retrainings = serializers.CharField(source='retraining_list', read_only=True)
    phone = serializers.CharField(read_only=True)
    mobile = serializers.CharField(read_only=True)

    class Meta:
        model = Guide
        fields = (
            'id',
            'user',
            'profile',
            'qualifications',
            'retrainings',
            'phone', 'mobile'
        )

    # def validate(self, data):
    # def create(self, validated_data):
    # def update(self, instance, validated_data):