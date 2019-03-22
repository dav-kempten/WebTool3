from rest_framework import serializers

from server.models import Guide


class NameListSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(source='user.pk')
    firstName = serializers.CharField(source='user.first_name')
    lastName = serializers.CharField(source='user.last_name')

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName', 'lastName'
        )
