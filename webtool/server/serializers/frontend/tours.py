from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import (
    Tour, Guide, Category, Equipment, State, get_default_state, get_default_season, Event, Qualification
)
from server.serializers.frontend.core import EventSerializer, MoneyField, create_event, update_event


class TourListSerializer(serializers.ModelSerializer):

    id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)  # ? #
    reference = serializers.CharField(source='tour.reference.__str__', read_only=True)  # ? #
    title = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='tour.start_date', read_only=True)
    guideId = serializers.PrimaryKeyRelatedField(source='guide_id', read_only=True)
    ladiesOnly = serializers.BooleanField(source='ladies_only', read_only=True)
    winter = serializers.BooleanField(source='tour.reference.category.winter', read_only=True)
    summer = serializers.BooleanField(source='tour.reference.category.summer', read_only=True)
    minQuantity = serializers.IntegerField(source='min_quantity', read_only=True)
    maxQuantity = serializers.IntegerField(source='max_quantity', read_only=True)
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)
    stateId = serializers.PrimaryKeyRelatedField(source='state_id', read_only=True)  # ? #
    url = serializers.SerializerMethodField()

    class Meta:
        model = Tour
        fields = (
            'id',
            'reference',
            'title',
            'startDate',
            'guideId',
            'ladiesOnly',
            'winter',
            'summer',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'stateId',
            'url'
        )

    def get_url(self, obj):
        request = self.context['request']
        return reverse('tours-detail', args=[obj.pk], request=request)

    def get_title(self, obj):
        return obj.tour.title


class TourSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(source='pk', queryset=Tour.objects.all(), default=None, allow_null=True)
    reference = serializers.CharField(source='tour.reference.__str__', read_only=True)

    guideId = serializers.PrimaryKeyRelatedField(
        source='guide', default=None, allow_null=True, queryset=Guide.objects.all()
    )
    teamIds = serializers.PrimaryKeyRelatedField(
        source='team', many=True, default=[], queryset=Guide.objects.all()
    )

    tour = EventSerializer(default={})
    deadline = EventSerializer(default={})
    preliminary = EventSerializer(default={})
    lowEmissionAdventure = serializers.BooleanField(source='tour.lea', default=False)
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    isSpecial = serializers.BooleanField(source='is_special', default=False)
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category', default=None, allow_null=True, queryset=Category.objects.all()
    )

    qualificationIds = serializers.PrimaryKeyRelatedField(
        source='qualifications', many=True, default=[], queryset=Qualification.objects.all()
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
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)

    stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())

    # Administrative Felder fehlen noch !

    class Meta:
        model = Tour
        fields = (
            'id', 'reference',
            'guideId', 'teamIds',
            'tour', 'deadline', 'preliminary',
            'lowEmissionAdventure', 'ladiesOnly',
            'isSpecial', 'categoryId',
            'qualificationIds', 'preconditions',
            'equipmentIds', 'miscEquipment', 'equipmentService',
            'admission', 'advances', 'advancesInfo', 'extraCharges', 'extraChargesInfo',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'stateId',
        )

    def validate(self, data):
        print(self.instance)
        if self.instance is not None:
            # This is the Update case

            tour = self.instance

            instance_data = data.get('pk')
            if instance_data is None:
                raise serializers.ValidationError("instance Id is missing")
            elif instance_data.pk != tour.pk:
                raise serializers.ValidationError("Wrong instance Id")

            tour_data = data.get('tour')
            if tour_data is not None:
                tour_instance = tour_data.get('pk')
                if tour_instance is None:
                    raise serializers.ValidationError("tour Id is missing")
                elif tour_instance.pk != tour.tour_id:
                    raise serializers.ValidationError("Wrong meeting Id")

            deadline_data = data.get('deadline')
            if deadline_data is not None:
                deadline_instance = deadline_data.get('pk')
                if deadline_instance is None:
                    raise serializers.ValidationError("deadline Id is missing")
                elif deadline_instance.pk != tour.deadline_id:
                    raise serializers.ValidationError("Wrong deadline Id")

            preliminary_data = data.get('preliminary')
            if preliminary_data is not None:
                preliminary_instance = preliminary_data.get('pk')
                if preliminary_instance is None:
                    raise serializers.ValidationError("deadline Id is missing")
                elif preliminary_instance.pk != tour.preliminary_id:
                    raise serializers.ValidationError("Wrong deadline Id")

        return data

    def create(self, validated_data):
        instance = validated_data.pop('pk')
        if instance:
            return self.update(instance, validated_data)
        else:
            event_data = validated_data.pop('tour')
            deadline_data = validated_data.pop('deadline')
            preliminary_data = validated_data.pop('preliminary')
            team = validated_data.pop('team')
            qualifications = validated_data.pop('qualifications')
            equipments = validated_data.pop('equipments')
            state = validated_data.pop('state', get_default_state())
            category = validated_data.category
            season = get_default_season()
            event = create_event(event_data, dict(category=category, season=season, type=dict(topic=True)))
            tour = Tour.objects.create(tour=event, state=state, **validated_data)
            tour.team = team
            tour.qualifications = qualifications
            tour.equipments = equipments
            return tour

    def update(self, instance, validated_data):
        instance.guide = validated_data.get('guide', instance.guide)
        team = validated_data.get('team')
        if team is not None:
            instance.team = team
        tour_data = validated_data.get('tour')
        if tour_data is not None:
            tour = Event.objects.get(pk=tour_data.get('pk'))
            update_event(tour, tour_data, self.context)
        deadline_data = validated_data.get('deadline')
        if deadline_data is not None:
            deadline = Event.objects.get(pk=deadline_data.get('pk'))
            update_event(deadline, deadline_data, self.context)
        preliminary_data = validated_data.get('preliminary')
        if preliminary_data is not None:
            preliminary = Event.objects.get(pk=preliminary_data.get('pk'))
            update_event(preliminary, preliminary_data, self.context)
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
        instance.state = validated_data.get('state', instance.state)
        instance.save()
        return instance



