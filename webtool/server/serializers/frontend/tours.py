from rest_framework import serializers
from rest_framework.reverse import reverse

from server.models import (
    Tour, Guide, Category, Equipment, State, get_default_state, get_default_season, Event, Reference,
    Skill, Fitness, Qualification, Topic)
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
    youthOnTour = serializers.BooleanField(source='youth_on_tour', default=False)
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
            'youthOnTour',
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

    category = serializers.PrimaryKeyRelatedField(
        default=None, allow_null=True, write_only=True, queryset=Category.objects.all()
    )

    categoryId = serializers.PrimaryKeyRelatedField(
        default=None, allow_null=True, source='tour.reference.category', queryset=Category.objects.all()
    )

    categoryIds = serializers.PrimaryKeyRelatedField(
        source='categories', many=True, default=[], queryset=Category.objects.all()
    )
    tour = EventSerializer(default={})
    deadline = EventSerializer(default={})
    preliminary = EventSerializer(default={}, allow_null=True)
    info = serializers.CharField(default='', allow_blank=True)
    lowEmissionAdventure = serializers.BooleanField(source='tour.lea', default=False)
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    youthOnTour = serializers.BooleanField(source='youth_on_tour', default=False)
    miscCategory = serializers.CharField(source='misc_category', max_length=75, default='', allow_blank=True)
    qualificationIds = serializers.PrimaryKeyRelatedField(
        source='qualifications', many=True, default=[], queryset=Topic.objects.all()
    )
    preconditions = serializers.CharField(default='', allow_blank=True)

    equipmentIds = serializers.PrimaryKeyRelatedField(
        source='equipments', many=True, default=[], queryset=Equipment.objects.all()
    )
    miscEquipment = serializers.CharField(source='misc_equipment', max_length=75, default='', allow_blank=True)
    equipmentService = serializers.BooleanField(source='equipment_service', default=False)

    skillId = serializers.PrimaryKeyRelatedField(
        source='skill', default=None, allow_null=True, required=False, queryset=Skill.objects.all()
    )
    fitnessId = serializers.PrimaryKeyRelatedField(
        source='fitness', default=None, allow_null=True, required=False, queryset=Fitness.objects.all()
    )

    admission = MoneyField()
    advances = MoneyField()
    advancesInfo = serializers.CharField(source='advances_info', default='', allow_blank=True)
    extraCharges = MoneyField(source='extra_charges')
    extraChargesInfo = serializers.CharField(source='extra_charges_info', max_length=75, default='', allow_blank=True)
    minQuantity = serializers.IntegerField(source='min_quantity', default=0)
    maxQuantity = serializers.IntegerField(source='max_quantity', default=0)
    curQuantity = serializers.IntegerField(source='cur_quantity', read_only=True)

    portal = serializers.URLField(default='', allow_blank=True)
    deprecated = serializers.BooleanField(default=False, required=False)
    stateId = serializers.PrimaryKeyRelatedField(source='state', required=False, queryset=State.objects.all())

    message = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)
    comment = serializers.CharField(default='', required=False, allow_null=True, allow_blank=True)

    # Administrative Felder fehlen noch !

    class Meta:
        model = Tour
        fields = (
            'id', 'reference',
            'guideId', 'teamIds',
            'categoryId', 'category', 'categoryIds',
            'tour', 'deadline', 'preliminary',
            'info',
            'lowEmissionAdventure', 'ladiesOnly', 'youthOnTour',
            'miscCategory',
            'qualificationIds', 'preconditions',
            'equipmentIds', 'miscEquipment', 'equipmentService',
            'skillId', 'fitnessId',
            'admission', 'advances', 'advancesInfo', 'extraCharges', 'extraChargesInfo',
            'minQuantity', 'maxQuantity', 'curQuantity',
            'portal', 'deprecated', 'stateId',
            'message', 'comment'
        )

    def validate(self, data):
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
                    raise serializers.ValidationError("deadline is not defined")
                elif deadline_instance.pk != tour.deadline_id:
                    raise serializers.ValidationError("Wrong deadline Id")

            preliminary_data = data.get('preliminary')
            if preliminary_data is not None:
                preliminary_instance = preliminary_data.get('pk')
                if preliminary_instance is None:
                    raise serializers.ValidationError("preliminary is not defined")
                elif preliminary_instance.pk != tour.preliminary_id:
                    raise serializers.ValidationError("Wrong preliminary Id")

        return data

    def create(self, validated_data):
        instance = validated_data.pop('pk')
        if instance:
            return self.update(instance, validated_data)
        else:
            tour_data = validated_data.pop('tour')
            deadline_data = validated_data.pop('deadline')
            preliminary_data = validated_data.pop('preliminary')
            info = validated_data.pop('info')
            team = validated_data.pop('team')
            qualifications = validated_data.pop('qualifications')
            equipments = validated_data.pop('equipments')
            state = validated_data.pop('state', get_default_state())
            category = validated_data.pop('category')
            categories = validated_data.pop('categories')
            season = get_default_season()

            if not 'start_date' in tour_data:
                raise serializers.ValidationError("Tour 'start_date' have to be defined")

            if category:
                tour_event = create_event(tour_data, dict(category=category, season=season, type=dict(tour=True)))
            else:
                raise serializers.ValidationError("Tour needs a category for creation")

            if not deadline_data:
                raise serializers.ValidationError("Deadline have to be defined")

            deadline_event = create_event(deadline_data, dict(category=None, season=season, type=dict(deadline=True)))

            if not preliminary_data:
                tour = Tour.objects.create(tour=tour_event, deadline=deadline_event, preliminary=None,
                                           state=state, **validated_data)
            else:
                preliminary_event = create_event(preliminary_data, dict(category=None, season=season, type=dict(preliminary=True)))
                tour = Tour.objects.create(tour=tour_event, deadline=deadline_event, preliminary=preliminary_event,
                                        state=state, **validated_data)
                update_event(Event.objects.get(pk=tour.preliminary.pk), dict(name="Vorbesprechung "+str(tour.tour.reference)), self.context)

            update_event(Event.objects.get(pk=tour.deadline.pk), dict(name="Deadline für " + str(tour.tour.reference)), self.context)
            tour.categories = categories
            tour.info = info
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
        instance.info = validated_data.get('info', instance.info)
        instance.ladies_only = validated_data.get('ladies_only', instance.ladies_only)
        instance.tour.lea = tour_data.get('lea', instance.tour.lea)
        instance.youth_on_tour = validated_data.get('youth_on_tour', instance.youth_on_tour)
        qualifications = validated_data.get('qualifications')
        if qualifications is not None:
            instance.qualifications = qualifications
        instance.preconditions = validated_data.get('preconditions', instance.preconditions)
        equipments = validated_data.get('equipments')
        if equipments is not None:
            instance.equipments = equipments
        instance.misc_equipment = validated_data.get('misc_equipment', instance.misc_equipment)
        instance.equipment_service = validated_data.get('equipment_service', instance.equipment_service)
        instance.skill = validated_data.get('skill', instance.skill)
        instance.fitness = validated_data.get('fitness', instance.fitness)
        instance.admission = validated_data.get('admission', instance.admission)
        instance.advances = validated_data.get('advances', instance.advances)
        instance.advances_info = validated_data.get('advances_info', instance.advances_info)
        instance.extra_charges = validated_data.get('extra_charges', instance.extra_charges)
        instance.extra_charges_info = validated_data.get('extra_charges_info', instance.extra_charges_info)
        instance.min_quantity = validated_data.get('min_quantity', instance.min_quantity)
        instance.max_quantity = validated_data.get('max_quantity', instance.max_quantity)
        instance.deprecated = validated_data.get('deprecated', instance.deprecated)
        instance.state = validated_data.get('state', instance.state)
        instance.message = validated_data.get('message', instance.message)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.save()

        return instance