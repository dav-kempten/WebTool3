from rest_framework import serializers
from server.models import Qualification, UserQualification, QualificationGroup

class QualificationGroupSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=QualificationGroup.objects.all(), default=None, allow_null=True
    )
    name = serializers.CharField()

    class Meta:
        model = QualificationGroup
        fields = ('id',
                  'name')


class QualificationSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=Qualification.objects.all(), default=None, allow_null=True
    )
    code = serializers.CharField()
    name = serializers.CharField()
    group = serializers.PrimaryKeyRelatedField(
        queryset=QualificationGroup.objects.all(), default=None, allow_null=True
    )
    # group = QualificationGroupSerializer(default={})

    class Meta:
        model = Qualification
        fields = ('id',
                  'code',
                  'name',
                  'group')

class UserQualificationSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=UserQualification.objects.all(), default=None, allow_null=True
    )
    # qualification = serializers.PrimaryKeyRelatedField(
    #     queryset=Qualification.objects.all(), default=None, allow_null=True
    # )
    qualification = QualificationSerializer(default={})
    aspirant = serializers.BooleanField(default=False)
    year = serializers.IntegerField()
    inactive = serializers.BooleanField(default=False)
    note = serializers.CharField(allow_blank=True)


    class Meta:
        model = UserQualification
        fields = ('id',
                  'qualification',
                  'aspirant',
                  'year',
                  'inactive',
                  'note'
                  )
