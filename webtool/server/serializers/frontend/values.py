from rest_framework import serializers

from server.models import Topic, Equipment
from .core import MoneyField


class StateListField(serializers.ListField):
    id = serializers.IntegerField()
    state = serializers.CharField()
    description = serializers.CharField()


class CategoryListField(serializers.ListField):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    tour = serializers.BooleanField()
    talk = serializers.BooleanField()
    instruction = serializers.BooleanField()
    collective = serializers.BooleanField()
    winter = serializers.BooleanField()
    summer = serializers.BooleanField()
    indoor = serializers.BooleanField()


class CollectiveListField(serializers.ListField):
    id = serializers.IntegerField()
    code = serializers.CharField()
    title = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()


class TopicListField(serializers.ListField):
    id = serializers.IntegerField()
    code = serializers.CharField()
    title = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    qualificationIds = serializers.PrimaryKeyRelatedField(source='qualifications', many=True, queryset=Topic.objects.all())
    preconditions = serializers.CharField()
    equipmentIds = serializers.PrimaryKeyRelatedField(source='equipments', many=True, queryset=Equipment.objects.all())
    miscEquipment = serializers.CharField(source='misc_equipment')


class ApproximateListField(serializers.ListField):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    startTime = serializers.TimeField(source='start_time')


class EquipmentListField(serializers.ListField):
    id = serializers.IntegerField()
    code = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()


class SkillListField(serializers.ListField):
    id = serializers.IntegerField()
    level = serializers.CharField()
    code = serializers.CharField()
    description = serializers.CharField()


class FitnessListField(serializers.ListField):
    id = serializers.IntegerField()
    level = serializers.CharField()
    code = serializers.CharField()
    description = serializers.CharField()


class InstructionCostListField(serializers.ListField):
    id = serializers.IntegerField()
    level = serializers.IntegerField()
    duration = serializers.IntegerField()
    compensation = MoneyField()


class TourCostSerializer(serializers.Serializer):
    halfDay = MoneyField(source='half_day')
    wholeDay = MoneyField(source='whole_day')
    admissionMinimum = MoneyField(source='min_admission')


class OpeningHourListField(serializers.ListField):
    days = serializers.CharField()
    hours = serializers.CharField()


class OpeningModeSerializer(serializers.Serializer):
    default = OpeningHourListField()
    special = OpeningHourListField()


class OpeningHourSerializer(serializers.Serializer):
    office = OpeningModeSerializer()
    desk = OpeningModeSerializer()


class ValueSerializer(serializers.Serializer):

    states = StateListField()
    categories = CategoryListField()
    approximates = ApproximateListField()
    equipments = EquipmentListField()
    skills = SkillListField()
    fitness = FitnessListField()
    topics = TopicListField()
    collectives = CollectiveListField()
    travelCostFactor = MoneyField(source='travel_cost_factor')
    accommodationCostMaximum = MoneyField(source='max_accommodation')
    accommodationCostDefault = MoneyField(source='accommodation')
    tourCalculationValues = TourCostSerializer(source='tour_calculation')
    instructionCalculationValues = InstructionCostListField(source='instruction_calculation')
    openingHours = OpeningHourSerializer(source='opening_hours')
