from rest_framework import serializers

from server.models import Guide


class NameListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    firstName = serializers.CharField(source='user.first_name', read_only=True)
    lastName = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Guide
        fields = (
            'id',
            'firstName', 'lastName'
        )
