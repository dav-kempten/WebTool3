from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import Profile


def update_profile(instance, validated_data, context):
    instance.member_id = validated_data.get('member_id', instance.member_id)
    instance.sex = validated_data.get('sex', instance.sex)
    instance.birth_date = validated_data.get('birth_date', instance.birth_date)
    instance.note = validated_data.get('note', instance.note)
    instance.member_year = validated_data.get('member_year', instance.member_year)
    instance.integral_member = validated_data.get('integral_member', instance.integral_member)
    instance.member_home = validated_data.get('member_home', instance.member_home)

    instance.save()

    return instance


class ProfileListSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    username = serializers.PrimaryKeyRelatedField(source='user.username',read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)
    memberId = serializers.CharField(source='member_id', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            'id',
            'username',
            'firstName', 'lastName',
            'memberId',
            'url',)

    def get_url(self, obj):
        request = self.context['request']
        return reverse('profiles-detail', args=[obj.pk], request=request)

class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=User.objects.all(), default=None, allow_null=True
    )
    memberId = serializers.CharField(source='member_id')
    sex = serializers.IntegerField()
    birthDate = serializers.DateField(source='birth_date')
    note = serializers.CharField(allow_blank=True)
    memberYear = serializers.IntegerField(source='member_year')
    integralMember = serializers.BooleanField(source='integral_member')
    memberHome = serializers.CharField(source='member_home', allow_blank=True)

    class Meta:
        model = Profile
        fields = (
            'id',
            'memberId', 'sex',
            'birthDate',
            'note',
            'memberYear',
            'integralMember',
            'memberHome',)

    def validate(self, data):
        if self.instance is not None:
            # This is the Update case
            profile = self.instance

            instance_data = data.get('pk')

            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            if instance_data.pk != profile.pk:
                raise serializers.ValidationError("Wrong instance Id")

            # member_home and integral_member is true and vice versa
            instance_integralmember = data.get('integral_member')
            instance_memberhome = data.get('member_home')

            if instance_integralmember:
                if instance_memberhome:
                    raise serializers.ValidationError("memberHome must be empty if integralMember is true")
            else:
                if not instance_memberhome:
                    raise serializers.ValidationError("memberHome must be set if integralMember is false")

        return data

    # def create(self, validated_data):

    def update(self, instance, validated_data):
        return update_profile(instance, validated_data, self.context)

