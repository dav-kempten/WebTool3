# -*- coding: utf-8 -*-
from rest_framework.reverse import reverse

from rest_framework import serializers

from server.models import Instruction, Equipment, Guide, Topic, Category, State
from server.serializers.frontend.core import EventSerializer,  MoneyField


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
        source='guide_id', default=None, allow_null=True, queryset=Guide.objects.all()
    )
    teamIds = serializers.PrimaryKeyRelatedField(
        source='team', many=True, default=None, allow_null=True, queryset=Guide.objects.all()
    )

    topicId = serializers.PrimaryKeyRelatedField(source='topic_id', queryset=Topic.objects.all())
    instruction = EventSerializer(default={})
    meetings = EventSerializer(source='meeting_list', many=True, default=[])
    lowEmissionAdventure = serializers.BooleanField(source='instruction.lea', default=False)
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    isSpecial = serializers.BooleanField(source='is_special', default=False)
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category_id', default=None, allow_null=True, queryset=Category.objects.all()
    )

    qualificationIds = serializers.PrimaryKeyRelatedField(
        source='qualifications', many=True, default=None, allow_null=True, queryset=Topic.objects.all()
    )
    preconditions = serializers.CharField(default='', allow_blank=True)

    equipmentIds = serializers.PrimaryKeyRelatedField(
        source='equipments', many=True, default=None, allow_null=True, queryset=Equipment.objects.all()
    )
    miscEquipment = serializers.CharField(source='misc_equipment', default='', allow_blank=True)
    equipmentService = serializers.BooleanField(source='equipment_service', default=False)

    admission = MoneyField()
    advances = MoneyField()
    advancesInfo = serializers.CharField(source='advances_info', default='', allow_blank=True)
    extraCharges = MoneyField(source='extra_charges')
    extraChargesInfo = serializers.CharField(source='extra_charges_info', default='', allow_blank=True)
    minQuantity = serializers.IntegerField(source='min_quantity', default=0)
    maxQuantity = serializers.IntegerField(source='max_quantity', default=0)
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)

    stateId = serializers.PrimaryKeyRelatedField(source='state_id', default=1, queryset=State.objects.all())

    # Administrative Felder fehlen noch !

    class Meta:
        model = Instruction
        fields = (
            'id', 'reference',
            'guideId', 'teamIds',
            'topicId',
            'instruction', 'meetings',
            'lowEmissionAdventure', 'ladiesOnly',
            'isSpecial', 'categoryId',
            'qualificationIds', 'preconditions',
            'equipmentIds', 'miscEquipment', 'equipmentService',
            'admission', 'advances', 'advancesInfo', 'extraCharges', 'extraChargesInfo',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'stateId',
        )

    def create(self, validated_data):
        print("Create")
        print(validated_data)
        return Instruction.objects.get(pk=2102)

    def update(self, instance, validated_data):
        print("Upadte")
        print(instance)
        print(validated_data)
        return instance
