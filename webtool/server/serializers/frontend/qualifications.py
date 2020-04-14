from rest_framework import serializers
from server.models import Qualification, UserQualification, QualificationGroup

def update_qualification(instance, validated_data, context):
    instance.qualification = validated_data.get('qualification', instance.qualification)
    instance.aspirant = validated_data.get('aspirant', instance.aspirant)
    instance.year = validated_data.get('year', instance.year)
    instance.inactive = validated_data.get('inactive', instance.inactive)
    instance.note = validated_data.get('note', instance.note)

    instance.save()

    return instance


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
    qualification = serializers.PrimaryKeyRelatedField(
        queryset=Qualification.objects.all(), default=None, allow_null=True
    )
    # qualification = QualificationSerializer(default={})
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

    def validate(self, data):
        if self.instance is not None:
            # This is the update case
            user_qualification = self.instance

            instance_data = data.get('pk')

            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != user_qualification.pk:
                raise serializers.ValidationError("Wrong instance Id")

        return data

    def update(self, instance, validated_data):
        return update_qualification(instance, validated_data, self.context)
