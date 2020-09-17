# -*- coding: utf-8 -*-
from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import (
    Instruction, Equipment, Guide, Topic, Category, State, Event, get_default_season, get_default_state
)
from server.serializers.frontend.core import EventSerializer, MoneyField, create_event, update_event


class InstructionListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    reference = serializers.CharField(source='instruction.reference.__str__', read_only=True)
    title = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='instruction.start_date', read_only=True)
    guideId = serializers.PrimaryKeyRelatedField(source='guide_id', read_only=True)
    ladiesOnly = serializers.BooleanField(source='ladies_only', read_only=True)
    winter = serializers.BooleanField(source='instruction.reference.category.winter', read_only=True)
    summer = serializers.BooleanField(source='instruction.reference.category.summer', read_only=True)
    indoor = serializers.BooleanField(source='instruction.reference.category.climbing', read_only=True)
    minQuantity = serializers.IntegerField(source='min_quantity', read_only=True)
    maxQuantity = serializers.IntegerField(source='max_quantity', read_only=True)
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)
    stateId = serializers.PrimaryKeyRelatedField(source='state_id', read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Instruction
        fields = (
            'id',
            'reference',
            'title',
            'startDate',
            'guideId',
            'ladiesOnly',
            'winter',
            'summer',
            'indoor',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'stateId',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('instructions-detail', args=[obj.pk], request=request)

    def get_title(self, obj):
        if obj.is_special:
            return obj.instruction.title
        else:
            return obj.topic.name


class InstructionSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Instruction.objects.all(), default=None, allow_null=True)
    reference = serializers.CharField(source='instruction.reference.__str__', read_only=True)

    guideId = serializers.PrimaryKeyRelatedField(
        source='guide', default=None, allow_null=True, queryset=Guide.objects.all()
    )
    teamIds = serializers.PrimaryKeyRelatedField(
        source='team', many=True, default=[], queryset=Guide.objects.all()
    )

    topicId = serializers.PrimaryKeyRelatedField(source='topic', queryset=Topic.objects.all())
    instruction = EventSerializer(default={})
    meetings = EventSerializer(source='meeting_list', many=True, default=[])
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    isSpecial = serializers.BooleanField(source='is_special', default=False)
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category', default=None, allow_null=True, queryset=Category.objects.all()
    )

    qualificationIds = serializers.PrimaryKeyRelatedField(
        source='qualifications', many=True, default=[], queryset=Topic.objects.all()
    )
    preconditions = serializers.CharField(default='', allow_blank=True)

    equipmentIds = serializers.PrimaryKeyRelatedField(
        source='equipments', many=True, default=[], queryset=Equipment.objects.all()
    )
    miscEquipment = serializers.CharField(source='misc_equipment', max_length=75, default='', allow_blank=True)
    equipmentService = serializers.BooleanField(source='equipment_service', default=False)

    admission = MoneyField()
    advances = MoneyField()
    advancesInfo = serializers.CharField(source='advances_info', default='', allow_blank=True)
    extraCharges = MoneyField(source='extra_charges')
    extraChargesInfo = serializers.CharField(source='extra_charges_info', max_length=75, default='', allow_blank=True)
    minQuantity = serializers.IntegerField(source='min_quantity', default=0)
    maxQuantity = serializers.IntegerField(source='max_quantity', default=0)
    curQuantity = serializers.IntegerField(source='cur_quantity', default=0)

    stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())
    deprecated = serializers.BooleanField(default=False, required=False)

    message = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)
    comment = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)

    # Administrative Felder fehlen noch !

    class Meta:
        model = Instruction
        fields = (
            'id', 'reference',
            'guideId', 'teamIds',
            'topicId',
            'instruction', 'meetings',
            'ladiesOnly',
            'isSpecial', 'categoryId',
            'qualificationIds', 'preconditions',
            'equipmentIds', 'miscEquipment', 'equipmentService',
            'admission', 'advances', 'advancesInfo', 'extraCharges', 'extraChargesInfo',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'deprecated', 'stateId',
            'message', 'comment'
        )

    def validate(self, data):
        print(self.instance)
        if self.instance is not None:
            # This is the Update case

            instruction = self.instance

            instance_data = data.get('pk')
            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != instruction.pk:
                raise serializers.ValidationError("Wrong instance Id")

            instruction_data = data.get('instruction')
            if instruction_data is not None:
                instruction_instance = instruction_data.get('pk')
                if instruction_instance is None:
                    raise serializers.ValidationError("instruction Id is missing")
                elif instruction_instance.pk != instruction.instruction_id:
                    raise serializers.ValidationError("Wrong meeting Id")

            meeting_list = data.get('meeting_list')
            if meeting_list is not None:
                meeting_ids = set(instruction.meeting_list.values_list('pk', flat=True))
                for meeting_data in meeting_list:
                    meeting_instance = meeting_data.get('pk')
                    if meeting_instance is None:
                        # meeting will be new created
                        continue
                    elif meeting_instance.pk not in meeting_ids:
                        raise serializers.ValidationError(
                            f"meeting Id {meeting_instance.pk} is not member of instruction with id {instruction.pk}"
                        )
                    meeting_ids.remove(meeting_instance.pk)
                if len(meeting_ids) > 0:
                    raise serializers.ValidationError(
                        "meeting_list is not complete"
                    )

        return data

    def create(self, validated_data):
        instance = validated_data.pop('pk')
        if instance:
            return self.update(instance, validated_data)
        else:
            event_data = validated_data.pop('instruction')
            meeting_list = validated_data.pop('meeting_list')
            team = validated_data.pop('team')
            qualifications = validated_data.pop('qualifications')
            equipments = validated_data.pop('equipments')
            state = validated_data.pop('state', get_default_state())
            topic = validated_data.get('topic')
            category = topic.category
            season = get_default_season()
            event = create_event(event_data, dict(category=category, season=season, type=dict(topic=True)))
            instruction = Instruction.objects.create(instruction=event, state=state, **validated_data)
            for meeting_data in meeting_list:
                meeting = create_event(meeting_data, dict(season=season, type=dict(meeting=True)))
                meeting.instruction = instruction
                meeting.save()
            instruction.team = team
            instruction.qualifications = qualifications
            instruction.equipments = equipments
            return instruction

    def update(self, instance, validated_data):
        instance.guide = validated_data.get('guide', instance.guide)
        team = validated_data.get('team')
        if team is not None:
            instance.team = team
        instruction_data = validated_data.get('instruction')
        if instruction_data is not None:
            instruction = Event.objects.get(pk=instruction_data.get('pk'))
            update_event(instruction, instruction_data, self.context)
        meeting_list = validated_data.get('meeting_list')
        if meeting_list is not None:
            season = instance.topic.seasons.get(current=True)
            for meeting_data in meeting_list:
                new_meeting = meeting_data.get('pk') is None
                meeting = create_event(meeting_data, dict(season=season, type=dict(meeting=True)))
                if new_meeting:
                    meeting.instruction = instance
                    meeting.save()
        instance.ladies_only = validated_data.get('ladies_only', instance.ladies_only)
        instance.is_special = validated_data.get('is_special', instance.is_special)
        instance.category = validated_data.get('category', instance.category)
        qualifications = validated_data.get('qualifications')
        if qualifications is not None:
            instance.qualifications = qualifications
        instance.preconditions = validated_data.get('preconditions', instance.preconditions)
        equipments = validated_data.get('equipments')
        if equipments is not None:
            instance.equipments = equipments
        instance.misc_equipment = validated_data.get('misc_equipment', instance.misc_equipment)
        instance.equipment_service = validated_data.get('equipment_service', instance.equipment_service)
        instance.admission = validated_data.get('admission', instance.admission)
        instance.advances = validated_data.get('advances', instance.advances)
        instance.advances_info = validated_data.get('advances_info', instance.advances_info)
        instance.extra_charges = validated_data.get('extra_charges', instance.extra_charges)
        instance.extra_charges_info = validated_data.get('extra_charges_info', instance.extra_charges_info)
        instance.min_quantity = validated_data.get('min_quantity', instance.min_quantity)
        instance.max_quantity = validated_data.get('max_quantity', instance.max_quantity)
        instance.cur_quantity = validated_data.get('cur_quantity', instance.cur_quantity)
        instance.deprecated = validated_data.get('deprecated', instance.deprecated)
        instance.state = validated_data.get('state', instance.state)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.message = validated_data.get('message', instance.message)
        instance.save()
        return instance
