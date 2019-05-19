from rest_framework import serializers


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


class ApproximateListField(serializers.ListField):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    startTime = serializers.TimeField()


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


class MoneyField(serializers.DecimalField):

    def __init__(self, source=None):

        super(self.__class__, self).__init__(
            source=source,
            decimal_places=2,
            max_digits=6,
        )


class InstructionCostListField(serializers.ListField):
    id = serializers.IntegerField()
    level = serializers.IntegerField()
    duration = serializers.IntegerField()
    compensation = MoneyField()


class TourCostSerializer(serializers.Serializer):
    halfDay = MoneyField(source='half_day')
    wholeDay = MoneyField(source='whole_day')
    admissionMinimum = MoneyField(source='min_admission')


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
