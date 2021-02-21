from rest_framework import serializers
from rest_framework.reverse import reverse
from django.core.mail import send_mail
import math

from server.models import (
    Tour, Guide, Category, Equipment, State, get_default_state, get_default_season, Event, Reference,
    Skill, Fitness, UserQualification, Qualification, Topic)
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
    ladiesOnly = serializers.BooleanField(source='ladies_only', default=False)
    youthOnTour = serializers.BooleanField(source='youth_on_tour', default=False)
    relaxed = serializers.BooleanField(default=False)
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
    curQuantity = serializers.IntegerField(source='cur_quantity', default=0)

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
            'ladiesOnly', 'youthOnTour', 'relaxed',
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
            tour_data.update({'new': True})
            deadline_data = validated_data.pop('deadline')
            preliminary_data = validated_data.pop('preliminary')
            info = validated_data.pop('info')
            team = validated_data.pop('team')
            qualifications = validated_data.pop('qualifications')
            equipments = validated_data.pop('equipments')
            state = validated_data.pop('state', get_default_state())
            category = validated_data.pop('category')
            # Set Youth-On-Tour if tour is especially for youth
            if "Jugend" in category.name:
                youth_on_tour = True
                validated_data.pop('youth_on_tour')
            else:
                youth_on_tour = validated_data.pop('youth_on_tour')
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
                                           state=state, youth_on_tour=youth_on_tour, **validated_data)
            else:
                preliminary_event = create_event(preliminary_data, dict(category=None, season=season, type=dict(preliminary=True)))
                tour = Tour.objects.create(tour=tour_event, deadline=deadline_event, preliminary=preliminary_event,
                                        state=state, youth_on_tour=youth_on_tour, **validated_data)
                update_event(Event.objects.get(pk=tour.preliminary.pk), dict(title="VB " + str(tour.tour.reference),
                                                                             name="Vorbesprechung "+ str(tour.tour.reference)), self.context)

            update_event(Event.objects.get(pk=tour.deadline.pk), dict(title="AS " + str(tour.tour.reference),
                                                                      name="Anmeldeschluss für " + str(tour.tour.reference)), self.context)
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
        instance.youth_on_tour = validated_data.get('youth_on_tour', instance.youth_on_tour)
        instance.relaxed = validated_data.get('relaxed', instance.relaxed)
        categories = validated_data.get('categories')
        if categories is not None:
            instance.categories = categories
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
        instance.advances = validated_data.get('advances', instance.advances)
        instance.advances_info = validated_data.get('advances_info', instance.advances_info)
        instance.extra_charges = validated_data.get('extra_charges', instance.extra_charges)
        instance.extra_charges_info = validated_data.get('extra_charges_info', instance.extra_charges_info)
        instance.min_quantity = validated_data.get('min_quantity', instance.min_quantity)
        instance.max_quantity = validated_data.get('max_quantity', instance.max_quantity)
        instance.cur_quantity = validated_data.get('cur_quantity', instance.cur_quantity)
        if validated_data.get('admission', instance.admission) == 0:
            # Tour-admission calculation
            trainer_ids = [instance.guide.pk]
            for el in instance.team.all():
                trainer_ids.append(el.pk)
            instance.admission = self.calculate_admission(
                start_date=tour_data['start_date'], end_date=tour_data['end_date'], trainer=trainer_ids,
                distance=tour_data['distance'], min_tn=instance.min_quantity)
        else:
            instance.admission = validated_data.get('admission', instance.admission)
        instance.deprecated = validated_data.get('deprecated', instance.deprecated)
        instance.state = validated_data.get('state', instance.state)
        if instance.state.pk == 2:
            self.send_tour_notification(reference=instance.tour.reference.__str__())
        instance.message = validated_data.get('message', instance.message)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.save()

        return instance

    @staticmethod
    def send_tour_notification(reference=None):
        send_mail(
            subject='Tour ' + reference,
            message='Die Tour ' + reference + ' wurde auf Fertig gestellt und kann geprüft werden.',
            from_email='django@dav-kempten.de',
            recipient_list=['jojo@dav-kempten.de', 'matthias.keller@dav-kempten.de', 'info@dav-kempten.de']
        )

    def calculate_admission(self, start_date=None, end_date=None, trainer=None, distance=0, min_tn=1):
        # Calculation total amount of trainer-price per day
        if end_date and trainer and min_tn is not 0:
            trainer_sets = []
            trainer_price = 0.00
            qualification_sets = [UserQualification.objects.filter(user__pk=el) for el in trainer]
            for qualification_set in qualification_sets:
                for entry in qualification_set:
                    if entry.qualification.code[:2] == 'TB':
                        trainer_sets.append(85.00)
                    elif entry.qualification.code[:2] == 'TC':
                        trainer_sets.append(70.00)
                    else:
                        trainer_sets.append(70.00)   # NK = not known
                trainer_price = trainer_price + max(trainer_sets)
            amount_days = (end_date-start_date).days
            prize_distance = distance * 0.30

            prize_whole = math.ceil((trainer_price * amount_days + 40.00 * len(trainer) * (amount_days-1) +
                                    prize_distance * len(trainer)) / min_tn)

        else:
            prize_whole = 10.00

        return prize_whole
