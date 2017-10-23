# -*- coding: utf-8 -*-
import json
from decimal import Decimal
from django.utils.dateparse import parse_date, parse_time

from . import Season, Guide, Category, Reference, Event, Approximate, Tour, Skill, Fitness, Chapter
from . import defaults

REFERENCE_RANGE = set(range(1, 100))


def create_reference(category=None, season=None, **kwargs):

    reference = None
    if isinstance(category, str):
        try:
            category = Category.objects.get(code=category, **kwargs)
        except Category.DoesNotExist:
            print('Category "{}" nicht gefunden'.format(category))
            return None

    if season is None:
        season = defaults.get_default_season()

    if category is None:
        category = Category.objects.filter(seasons=season, **kwargs).order_by('code').last()
        if category is None:
            print('Category "{}" nicht gefunden'.format(repr(kwargs)))
            return None

    cur_references = set(Reference.objects.filter(category=category, season=season).values_list('reference', flat=True))
    free_references = REFERENCE_RANGE - cur_references
    if free_references:
        reference = Reference.objects.create(season=season, category=category, reference=min(free_references))
    if reference is None:
        category_code = category.code
        category_index = category_code[-1]
        if category_index < "0" or category_index > "9":
            print('Category "{}" hat keinen Zähler'.format(category_code))
            return None
        category.pk = None
        category_index = int(category_index) + 1
        category.code = "{}{:1d}".format(category_code[:2], category_index)
        category.save()
        category.seasons.add(season)
        reference = create_reference(category=category, season=season, **kwargs)
    return reference


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
        admission=None, advances=None, advances_info='', extra_charges='',
        description='',
        rendezvous='', location='', source='',
        preliminary_date=None, preliminary_time=None,
        info=None,
        link='', portal='', map='', cover='',
        distal=None, distance=0, public_transport=False, low_emission_adventure=False, ladies_only=False,
        skill=None, fitness=None,
        state=None,
        season=None,
        qualifications=None,
        equipments=None,
        categories=None,
        misc_category='',
        team=None,
        message='',
        comment='',
        calc_budget=None,
        budget_info=''
):
    if isinstance(guide, str):
        try:
            guide = Guide.objects.get(user__username=guide)
        except Guide.DoesNotExist:
            guide = Guide.objects.get(user__profile__member_id=guide)

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

    if admission is None:
        admission = Decimal('0.00')

    if advances is None:
        advances = Decimal('0.00')

    if isinstance(skill, int):
        skill = Skill.objects.get(order=skill)

    if skill is None:
        skill = defaults.get_default_skill()

    if isinstance(fitness, int):
        fitness = Fitness.objects.get(order=fitness)

    if fitness is None:
        fitness = defaults.get_default_fitness()

    if isinstance(approximate, str):
        try:
            approximate = Approximate.objects.get(name=approximate, seasons=season)
        except Approximate.DoesNotExist:
            print('Approximate "{}" nicht gefunden'.format(approximate))
            return None

    reference = create_reference(category, season=season, tour=True)
    if reference is None:
        return None
    category = reference.category

    deadline = create_deadline(reference, deadline_date, season)
    if deadline is None:
        reference.delete()
        return None

    preliminary = None
    if preliminary_date is not None and preliminary_time is not None and info is None:
        preliminary = create_preliminary(reference, preliminary_date, preliminary_time, rendezvous, season)
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
        link=link, map=map,
        distal=distal, distance=distance, lea=low_emission_adventure, public_transport=public_transport
    )

    tour = Tour.objects.create(
        season=season,
        preconditions=preconditions,
        guide=guide,
        skill=skill, fitness=fitness,
        admission=admission, advances=advances, advances_info=advances_info, extra_charges=extra_charges,
        min_quantity=min_quantity, max_quantity=max_quantity,
        ladies_only=ladies_only,
        deadline=deadline,
        preliminary=preliminary, info=info,
        tour=event, state=state
    )

    chapter_name = category.name
    chapter = Chapter.objects.get(section__part__name="Vorschläge", section__name="Touren", name=chapter_name)
    tour.chapter.add(chapter)

    return tour


def delete_reference(reference):
    if isinstance(reference, str):
        reference = Reference.get_reference(reference)
    event = reference.event
    if hasattr(event, 'tour') and event.tour:
        tour = event.tour
        deadline = tour.deadline
        deadline_reference = deadline.reference
        preliminary = None
        preliminary_reference = None
        if hasattr(tour, 'preliminary') and tour.preliminary:
            preliminary = tour.preliminary
            preliminary_reference = preliminary.reference
        n = tour.delete()
        if n[0] > 0:
            print("Tour {} gelöscht".format(tour.tour.reference), end='')
        n = deadline.delete()
        if n[0] > 0:
            print(", Anmeldeschluss {} gelöscht".format(deadline_reference), end='')
        n = deadline_reference.delete()
        if n[0] > 0:
            print(", Buchugscode {} gelöscht".format(deadline_reference), end='')
        if preliminary:
            n = preliminary.delete()
            if n[0] > 0:
                print(" Vorbesprechung {} gelöscht".format(preliminary_reference), end='')
            n = preliminary_reference.delete()
            if n[0] > 0:
                print(" Buchungscode {} gelöscht".format(preliminary_reference), end='')
    n = event.delete()
    if n[0] > 0:
        print(", Tourentermin {} gelöscht".format(event.reference), end='')
    n = reference.delete()
    if n[0] > 0:
        print(", Buchungscode {} gelöscht".format(reference), end='')
    print()
