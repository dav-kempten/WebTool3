from rest_framework import serializers

from server.models import UserQualification

class UserQualificationListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user.pk', read_only=True)
    qualification = serializers.CharField(source='qualification.code', read_only=True)
    aspirant = serializers.BooleanField(read_only=True)
    year = serializers.IntegerField(read_only=True)
    inactive = serializers.BooleanField(read_only=True)
    note = serializers.CharField(read_only=True)

    class Meta:
        model = UserQualification
        fields = (
            'id',
            'user_id',
            'qualification',
            'aspirant',
            'year',
            'inactive',
            'note'
        )
