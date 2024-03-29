from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import (
    Talk, State, get_default_state, Event, get_default_season
)

from server.serializers.frontend.core import create_event, update_event, EventSerializer


class TalkListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    reference = serializers.CharField(source='talk.reference.__str__', read_only=True)
    title = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='talk.start_date', read_only=True)
    speaker = serializers.CharField(default=None, read_only=True)
    tariffs = serializers.IntegerField(source='tariffs', read_only=True)
    stateId = serializers.PrimaryKeyRelatedField(source='state_id', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Talk
        fields = (
            'id',
            'reference',
            'title',
            'startDate',
            'speaker',
            'tariffs',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('talks-detail', args=[obj.pk], request=request)

    def get_title(self, obj):
        return obj.talk.title

class TalkSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Talk.objects.all(), default=None, allow_null=True)
    reference = serializers.CharField(source='talk.reference.__str__', read_only=True)
    talk = EventSerializer(default={})
    startDate = serializers.DateField(source='talk.start_date', read_only=True)
    speaker = serializers.CharField(default=None, allow_null=True)
    admission = serializers.IntegerField(default=None, allow_null=True)
    minQuantity = serializers.IntegerField(source='min_quantity', read_only=True)
    maxQuantity = serializers.IntegerField(source='max_quantity', read_only=True)
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)
    tariffs = serializers.IntegerField(read_only=True)
    stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())

    class Meta:
        model = Talk
        fields = (
            'id', 'reference',
            'talk',
            'startDate',
            'speaker',
            'admission',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'tariffs',
            'stateId',
        )

    def validate(self, data):
        print(self.instance)
        if self.instance is not None:
            # This is the Update case

            talk = self.instance

            instance_data = data.get('pk')
            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != talk.pk:
                raise serializers.ValidationError("Wrong instance Id")

            talk_data = data.get('talk')
            if talk_data is not None:
                talk_instance = talk_data.get('pk')
                if talk_instance is None:
                    raise serializers.ValidationError("talk Id is missing")
                elif talk_instance.pk != talk.talk_id:
                    raise serializers.ValidationError("Wrong talk Id")

        return data

    def create(self, validated_data):
        instance = validated_data.pop('pk')
        if instance:
            return self.update(instance, validated_data)
        else:
            talk_data = validated_data.pop('talk')
            speaker = validated_data.pop('speaker')
            admission = validated_data.pop('admission')
            # max_quantity = validated_data.pop('max_quantity')
            state = validated_data.pop('state', get_default_state())
            season = get_default_season()
            talk_event = create_event(talk_data, dict(season=season, type=dict(talk=True)))
            talk = Talk.objects.create(talk=talk_event, state=state, **validated_data)
            talk.speaker = speaker
            talk.admission = admission
            # talk.max_quantity = max_quantity
            return talk

    def update(self, instance, validated_data):
        instance.speaker = validated_data.get('speaker', instance.speaker)
        talk_data = validated_data.get('talk')
        if talk_data is not None:
            talk = Event.objects.get(pk=talk_data.get('pk'))
            update_event(talk, talk_data, self.context)
        instance.title = validated_data.get('title', instance.title)
        instance.admission = validated_data.get('admission', instance.admission)
        instance.min_quantity = validated_data.get('min_quantity', instance.min_quantity)
        instance.max_quantity = validated_data.get('max_quantity', instance.max_quantity)
        instance.tariffs = validated_data.get('tariffs', instance.tariffs)
        instance.state = validated_data.get('state', instance.state)
        instance.save()
        return instance