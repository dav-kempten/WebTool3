from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import Profile


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
        instance_data = data.get('pk')
        if instance_data is not None:
            # This is the Update case
            profile = self.instance

            instance_data = data.get('pk')

            if self.instance is not None:
                if instance_data.pk != self.instance.pk:
                    raise serializers.ValidationError("Wrong instance Id")

        return data

    # def create(self, validated_data):

    # def update(self, instance, validated_data):
