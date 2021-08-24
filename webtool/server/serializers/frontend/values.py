from rest_framework import serializers
from server.models import Guide, Role

from .core import MoneyField


class StateListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    state = serializers.CharField(source='name', read_only=True)
    description = serializers.CharField(read_only=True)


class CategoryListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    code = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    tour = serializers.BooleanField(read_only=True)
    talk = serializers.BooleanField(read_only=True)
    instruction = serializers.BooleanField(read_only=True)
    collective = serializers.BooleanField(read_only=True)
    winter = serializers.BooleanField(read_only=True)
    summer = serializers.BooleanField(read_only=True)
    indoor = serializers.BooleanField(read_only=True)


class CollectiveListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    code = serializers.CharField(source='category.code', read_only=True)
    title = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    managers = serializers.PrimaryKeyRelatedField(source='managers', many=True, default=[], read_only=True)
    description = serializers.CharField(read_only=True)


class TopicListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    code = serializers.CharField(source='category.code', read_only=True)
    title = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    qualificationIds = serializers.PrimaryKeyRelatedField(source='qualifications', many=True, read_only=True)
    preconditions = serializers.CharField(read_only=True)
    equipmentIds = serializers.PrimaryKeyRelatedField(source='equipments', many=True, read_only=True)
    miscEquipment = serializers.CharField(source='misc_equipment', read_only=True)


class ApproximateListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    startTime = serializers.TimeField(source='start_time', read_only=True)


class EquipmentListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    code = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)


class SkillListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    level = serializers.CharField(read_only=True)
    code = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)


class FitnessListField(serializers.ListField):
    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    level = serializers.CharField(read_only=True)
    code = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)


class InstructionCostListField(serializers.ListField):
    id = serializers.IntegerField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    duration = serializers.IntegerField(read_only=True)
    compensation = MoneyField(read_only=True)


class TourCostSerializer(serializers.Serializer):
    halfDay = MoneyField(source='half_day', read_only=True)
    wholeDay = MoneyField(source='whole_day', read_only=True)
    admissionMinimum = MoneyField(source='min_admission', read_only=True)


class OpeningHourListField(serializers.ListField):
    days = serializers.CharField(read_only=True)
    hours = serializers.CharField(read_only=True)


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
