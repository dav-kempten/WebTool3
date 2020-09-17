from rest_framework import serializers

from server.models import Retraining

class RetrainingListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    user_pk = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    qualification = serializers.PrimaryKeyRelatedField(source='qualification.pk', read_only=True)
    year = serializers.IntegerField(read_only=True)
    specific = serializers.BooleanField(read_only=True)
    description = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True)

    class Meta:
        model = Retraining
        fields = (
            'id',
            'user_pk',
            'username',
            'qualification',
            'year',
            'specific',
            'description',
            'note'
        )
