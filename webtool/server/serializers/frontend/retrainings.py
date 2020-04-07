from django.contrib.auth.models import User
from rest_framework import serializers

from server.models import Retraining, Qualification


class RetrainingSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=Retraining.objects.all(), default=None, allow_null=True
    )
    qualification = serializers.PrimaryKeyRelatedField(
        queryset=Qualification.objects.all(), default=None, allow_null=True
    )
    year = serializers.IntegerField()
    specific = serializers.BooleanField(default=False)
    description = serializers.CharField(default='')
    note = serializers.CharField()

    class Meta:
        model = Retraining
        fields = ('id',
                  'qualification',
                  'year',
                  'specific',
                  'description',
                  'note'
                  )
