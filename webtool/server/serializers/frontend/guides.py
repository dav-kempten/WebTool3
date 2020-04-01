# -*- coding: utf-8 -*-
from django.contrib.auth.models import User
from rest_framework.reverse import reverse
from rest_framework import serializers
from server.models import Guide


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
    unknown = serializers.BooleanField(default=False)
    profile = serializers.JSONField(allow_null=True)
    qualifications = serializers.CharField(source='qualification_list', allow_blank=True)
    retrainings = serializers.CharField(source='retraining_list', allow_blank=True)
    email = serializers.EmailField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    mobile = serializers.CharField(allow_blank=True)

    class Meta:
        model = Guide
        fields = ('id',
                  'unknown'
                  'profile',
                  'qualifications',
                  'retrainings',
                  'email',
                  'phone', 'mobile')

    def validate(self, data):
        if self.instance is not None:
            # This is the Update case
            guide = self.instance

            instance_data = data.get('pk')

            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != guide.pk:
                raise serializers.ValidationError("Wrong instance Id")

        return data

    # def create(self, validated_data):

    def update(self, instance, validated_data):

        instance.profile = validated_data.get('profile', instance.profile)
        instance.unknown = validated_data.get('unknown', instance.unknown)
        instance.profile = validated_data.get('profile', instance.profile)
        instance.qualification_list = validated_data.get('qualification_list', instance.qualification_list)
        instance.retraining_list = validated_data.get('retraining_list', instance.retraining_list)
        instance.email = validated_data('email', instance.email)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.mobile = validated_data.get('mobile', instance.mobile)

        instance.save()

        return instance
