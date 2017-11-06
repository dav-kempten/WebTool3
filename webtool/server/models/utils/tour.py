# -*- coding: utf-8 -*-
from decimal import Decimal
from django.utils.dateparse import parse_date, parse_time

from .. import Event, Guide, Season, Skill, Fitness, Equipment, Topic, Category, Approximate, Reference, Tour, Chapter
from .. import defaults
from . import create_reference


def create_deadline(reference, start_date, season=None):

    if not isinstance(reference, str):
        reference = str(reference)
    title = 'AS {}'.format(reference)
    name = 'Anmeldeschluss {}'.format(str(reference))

    if isinstance(start_date, str):
        start_date = parse_date(start_date)

    if season is None:
        season = defaults.get_default_season()

    try:
        deadline = Event.objects.get(
            season=season, start_date=start_date, title=title, name=name
        )
    except Event.DoesNotExist:
        pass
    else:
        return deadline

    reference = create_reference(season=season, deadline=True)
    if reference is None:
        return None

    deadline = Event.objects.create(
        season=season, reference=reference, start_date=start_date,
        title=title, name=name
    )
    return deadline


def create_preliminary(reference, start_date, start_time, rendezvous=None, season=None):

    if not isinstance(reference, str):
        reference = str(reference)
    title = 'VB {}'.format(reference)
    name = 'Vorbesprechung {}'.format(str(reference))

    if isinstance(start_date, str):
        start_date = parse_date(start_date)

    if isinstance(start_time, str):
        start_time = parse_time(start_time)

    if rendezvous is None:
        rendezvous = "Geschäftsstelle"

    if season is None:
        season = defaults.get_default_season()

    try:
        preliminary = Event.objects.get(
            season=season,
            start_date=start_date, start_time=start_time,
            rendezvous=rendezvous, title=title, name=name
        )
    except Event.DoesNotExist:
        pass
    else:
        return preliminary

    reference = create_reference(season=season, preliminary=True)
    if reference is None:
        return None

    preliminary = Event.objects.create(
        season=season, reference=reference,
        start_date=start_date, start_time=start_time,
        rendezvous=rendezvous, title=title, name=name
    )
    return preliminary


def create_tour(
        category,
        title, name,
        guide,
        deadline_date,
        start_date, start_time=None,
        approximate=None,
        end_date=None, end_time=None,
        preconditions='',
        min_quantity=3, max_quantity=6,
        admission=None, advances=None, advances_info='', extra_charges=None, extra_charges_info='',
        description='',
        rendezvous='', location='', source='',
        preliminary_date=None, preliminary_time=None, preliminary_rendezvous=None,
        info='',
        link='', portal='', map='', cover='',
        distal=None, distance=0, public_transport=False, low_emission_adventure=False, ladies_only=False,
        skill=None, fitness=None,
        state=None,
        season=None,
        qualifications=None,
        equipments=None,
        misc_equipment='',
        categories=None,
        misc_category='',
        team=None,
        message='',
        comment='',
        budget_info='',
        reference=None
):
    if isinstance(guide, str):
        try:
            guide = Guide.objects.get(user__username=guide)
        except Guide.DoesNotExist:
            guide = Guide.objects.get(user__profile__member_id=guide)

    if isinstance(team, str):
        member = [g.strip() for g in team.split(',')]
        team = Guide.objects.filter(user__username__in=member)
        if not team.exists():
            team = Guide.objects.filter(user__profile__member_id__in=member)

    if isinstance(season, str):
        season = Season.objects.get(name=season)

    if season is None:
        season = defaults.get_default_season()

    if state is None:
        state = defaults.get_default_state()

    if isinstance(start_date, str):
        start_date = parse_date(start_date)

    if isinstance(start_time, str):
        start_time = parse_time(start_time)
    if not start_time:
        start_time = None

    if isinstance(end_date, str):
        end_date = parse_date(end_date)
        if end_date == start_date:
            end_date = None

    if isinstance(end_time, str):
        end_time = parse_time(end_time)
    if not end_time:
        end_time = None

    if distal is None:
        distal = bool((distance > 0) or source)

    if isinstance(admission, str):
        admission = Decimal(admission)

    if admission is None:
        admission = Decimal('0.00')

    if isinstance(advances, str):
        advances = Decimal(advances)

    if advances is None:
        advances = Decimal('0.00')

    if isinstance(extra_charges, str):
        extra_charges = Decimal(extra_charges)

    if extra_charges is None:
        extra_charges = Decimal('0.00')

    if isinstance(skill, int):
        skill = Skill.objects.get(order=skill)

    if skill is None:
        skill = defaults.get_default_skill()

    if isinstance(fitness, int):
        fitness = Fitness.objects.get(order=fitness)

    if fitness is None:
        fitness = defaults.get_default_fitness()

    if isinstance(equipments, str):
        equipments = Equipment.objects.filter(code__in=[e.strip() for e in equipments.split(',')])

    if isinstance(qualifications, str):
        qualifications = Topic.objects.filter(category__code__in=[c.strip() for c in qualifications.split(',')])

    if isinstance(categories, str):
        categories = Category.objects.filter(code__in=[c.strip() for c in categories.split(',')])

    if isinstance(approximate, str):
        try:
            approximate = Approximate.objects.get(name=approximate, seasons=season)
        except Approximate.DoesNotExist:
            print('Approximate "{}" nicht gefunden'.format(approximate))
            return None

    if isinstance(reference, str):
        reference = Reference.get_reference(reference, season)
        category = reference.category

    if reference is None:
        try:
            tour = Tour.objects.get(guide=guide, tour__start_date=start_date)
            event = tour.tour
            reference = event.reference
            category = reference.category
            deadline = tour.deadline
            preliminary = tour.preliminary
        except Tour.DoesNotExist:
            tour = None
    else:
        tour = Tour.objects.get(tour__reference=reference)
        event = tour.tour
        category = reference.category
        deadline = tour.deadline
        preliminary = tour.preliminary

    if tour is None:
        reference = create_reference(category, season=season, tour=True)
        if reference is None:
            return None
        category = reference.category

        deadline = create_deadline(reference, deadline_date, season)
        if deadline is None:
            reference.delete()
            return None

        preliminary = None
        if preliminary_date is not None and preliminary_time is not None and info is '':
            preliminary = create_preliminary(reference, preliminary_date, preliminary_time, preliminary_rendezvous, season)
            if preliminary is None:
                deadline.reference.delete()
                deadline.delete()
                reference.delete()
                return None
            info = ''

        event = Event.objects.create(
            season=season, reference=reference,
            start_date=start_date, start_time=start_time, approximate=approximate,
            end_date=end_date, end_time=end_time,
            title=title, name=name, description=description,
            rendezvous=rendezvous, source=source, location=location,
            link=link, map=map, cover=cover,
            distal=distal, distance=distance, lea=low_emission_adventure, public_transport=public_transport,
        )

        tour = Tour.objects.create(
            season=season,
            preconditions=preconditions,
            guide=guide,
            skill=skill, fitness=fitness,
            admission=admission,
            advances=advances, advances_info=advances_info,
            extra_charges=extra_charges, extra_charges_info=extra_charges_info,
            min_quantity=min_quantity, max_quantity=max_quantity,
            ladies_only=ladies_only,
            deadline=deadline,
            preliminary=preliminary, info=info,
            tour=event, state=state,
            comment=comment,
            budget_info=budget_info,
            message=message,
            portal=portal,
            misc_category=misc_category,
            misc_equipment=misc_equipment
        )
    else:
        deadline.start_date = deadline_date
        deadline.save()

        if preliminary:
            preliminary.start_date = preliminary_date
            preliminary.start_time = preliminary_time
            if preliminary_rendezvous is not None:
                preliminary.rendezvous = preliminary_rendezvous
            preliminary.save()

        event.start_date = start_date
        event.start_time = start_time
        event.approximate = approximate
        event.end_date = end_date
        event.end_time = end_time
        event.title = title
        event.name = name
        event.description = description
        event.rendezvous = rendezvous
        event.source = source
        event.location = location
        event.link = link
        event.map = map
        event.cover = cover
        event.distal = distal
        event.distance = distance
        event.lea = low_emission_adventure
        event.public_transport = public_transport
        event.save()

        tour.preconditions = preconditions
        tour.guide = guide
        tour.skill = skill
        tour.fitness = fitness
        tour.admission = admission
        tour.advances = advances
        tour.advances_info = advances_info
        tour.extra_charges = extra_charges
        tour.extra_charges_info = extra_charges_info
        tour.min_quantity = min_quantity
        tour.max_quantity = max_quantity
        tour.ladies_only = ladies_only
        tour.info = info
        tour.state = state
        tour.comment = comment
        tour.budget_info = budget_info
        tour.message = message
        tour.portal = portal
        tour.misc_category = misc_category
        tour.misc_equipment = misc_equipment
        tour.save()

    if equipments:
        tour.equipments = equipments
    else:
        tour.equipments.clear()

    if qualifications:
        tour.qualifications = qualifications
    else:
        tour.qualifications.clear()

    if categories:
        tour.categories = categories
    else:
        tour.categories.clear()

    if team:
        tour.team = team
    else:
        tour.team.clear()

    #chapter_name = category.name
    #chapter = Chapter.objects.get(section__part__name="Vorschläge", section__name="Touren", name=chapter_name)
    #tour.chapter.add(chapter)

    return tour
