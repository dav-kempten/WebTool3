# -*- coding: utf-8 -*-
from django.contrib.auth.models import User
from rest_framework.reverse import reverse
from rest_framework import serializers
from server.models import Guide, Profile, UserQualification, Retraining
from server.serializers.frontend.profiles import ProfileSerializer, update_profile
from server.serializers.frontend.qualifications import UserQualificationSerializer, update_qualification
from server.serializers.frontend.retrainings import RetrainingSerializer, update_retraining


class GuideListSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    username = serializers.PrimaryKeyRelatedField(source='user.username',read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    portrait = serializers.FileField(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        fields = (
            'id',
            'username',
            'firstName', 'lastName',
            'portrait',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('guides-detail', args=[obj.pk], request=request)

class GuideSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=User.objects.all(), default=None, allow_null=True
    )
    username = serializers.CharField(source='user.username',read_only=True)
    unknown = serializers.BooleanField(default=False)
    profile = serializers.JSONField(allow_null=True)
    qualifications = UserQualificationSerializer(source='user.qualification_list', many=True, default=[])
    retrainings = RetrainingSerializer(source='user.retraining_list', many=True, default=[])
    email = serializers.EmailField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    mobile = serializers.CharField(allow_blank=True)
    userProfile = ProfileSerializer(source = 'user.profile', allow_null=True)

    class Meta:
        model = Guide
        fields = ('id',
                  'username',
                  'unknown',
                  'profile',
                  'qualifications',
                  'retrainings',
                  'email',
                  'phone', 'mobile',
                  'userProfile'
                  )

    def validate(self, data):
        if self.instance is not None:
            # This is the Update case
            guide = self.instance

            instance_data = data.get('pk')

            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != guide.pk:
                raise serializers.ValidationError("Wrong instance Id")

            instance_user = data.get('user')
            instance_profile = instance_user.get('profile')

            # member_home and integral_member is true and vice versa
            instance_integralmember = instance_profile.get('integral_member')
            instance_memberhome = instance_profile.get('member_home')

            if instance_integralmember:
                if instance_memberhome:
                    raise serializers.ValidationError("memberHome must be empty if integralMember is true")
            else:
                if not instance_memberhome:
                    raise serializers.ValidationError("memberHome must be set if integralMember is false")

        return data

    # def create(self, validated_data):

    def update(self, instance, validated_data):

        instance.profile = validated_data.get('profile', instance.profile)
        instance.unknown = validated_data.get('unknown', instance.unknown)
        instance.profile = validated_data.get('profile', instance.profile)
        instance.qualification_list = validated_data.get('qualification_list', instance.qualification_list)
        instance.retraining_list = validated_data.get('retraining_list', instance.retraining_list)
        instance.email = validated_data.get('email', instance.email)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.mobile = validated_data.get('mobile', instance.mobile)

        user_data = validated_data.get('user')
        if user_data is not None:
            profile_data = user_data.get('profile')
            if profile_data is not None:
                profile = Profile.objects.get(pk=profile_data.get('pk'))
                update_profile(profile, profile_data, self.context)

            qualification_list = user_data.get('qualification_list')
            if qualification_list is not None:
                for qualification_data in qualification_list:
                    qualification = UserQualification.objects.get(pk=qualification_data.get('pk').id)
                    update_qualification(qualification, qualification_data, self.context)

            retraining_list = user_data.get('retraining_list')
            if retraining_list is not None:
                for retraining_data in retraining_list:
                    retraining = Retraining.objects.get(pk=retraining_data.get('pk').id)
                    update_retraining(retraining, retraining_data, self.context)

        instance.save()

        return instance
