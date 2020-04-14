from django.contrib.auth.models import User
from rest_framework import serializers

from server.models import Retraining, UserQualification

def update_retraining(instance, validated_data, context):
    instance.qualification = validated_data.get('qualification', instance.qualification)
    instance.year = validated_data.get('year', instance.year)
    instance.specific = validated_data.get('specific', instance.specific)
    instance.description = validated_data.get('description', instance.description)
    instance.note = validated_data.get('note', instance.note)

    instance.save()

    return instance


class RetrainingSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(
        source='pk', queryset=Retraining.objects.all(), default=None, allow_null=True
    )
    qualification = serializers.PrimaryKeyRelatedField(
        queryset=UserQualification.objects.all(), default=None, allow_null=True
    )
    year = serializers.IntegerField()
    specific = serializers.BooleanField(default=False)
    description = serializers.CharField(default='')
    note = serializers.CharField(allow_blank=True)

    class Meta:
        model = Retraining
        fields = ('id',
                  'qualification',
                  'year',
                  'specific',
                  'description',
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
            update_retraining(instance, validated_data, self.context)