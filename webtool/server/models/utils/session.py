# -*- coding: utf-8 -*-
from django.utils.dateparse import parse_date, parse_time

from .. import Season, Collective, Guide, Skill, Fitness, Equipment, Approximate, Reference, Session, Event
from .. import defaults
from . import create_reference


def create_session(
        title, name,
        start_date, start_time=None,
        guide=None,
        collective=None,
        approximate=None,
        end_date=None, end_time=None,
        description='',
        rendezvous='', location='', source='',
        link='', portal='', map='', cover='',
        speaker='',
        distal=None, distance=0, public_transport=False, low_emission_adventure=False, ladies_only=False,
        skill=None, fitness=None,
        state=None,
        season=None,
        equipments=None,
        misc_equipment='',
        team=None,
        reference=None
):
    if isinstance(season, str):
        season = Season.objects.get(name=season)

    if season is None:
        season = defaults.get_default_season()

    if isinstance(collective, str):
        try:
            collective = Collective.objects.get(seasons=season, category__code=collective)
        except Collective.DoesNotExist:
            collective = Collective.objects.get(seasons=season, name=collective)
        category = collective.category

    if isinstance(guide, str):
        try:
            guide = Guide.objects.get(seasons=season, user__username=guide)
        except Guide.DoesNotExist:
            guide = Guide.objects.get(seasons=season, user__profile__member_id=guide)

    if guide is None:
        guide = collective.managers.first()

    if isinstance(team, str):
        member = [g.strip() for g in team.split(',')]
        team = Guide.objects.filter(seasons=season, user__username__in=member)
        if not team.exists():
            team = Guide.objects.filter(seasons=season, user__profile__member_id__in=member)

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

    if isinstance(skill, int):
        skill = Skill.objects.get(seasons=season, order=skill)

    if skill is None:
        skill = defaults.get_no_skill()

    if isinstance(fitness, int):
        fitness = Fitness.objects.get(seasons=season, order=fitness)

    if fitness is None:
        fitness = defaults.get_no_fitness()

    if isinstance(equipments, str):
        equipments = Equipment.objects.filter(seasons=season, code__in=[e.strip() for e in equipments.split(',')])

    if isinstance(approximate, str):
        try:
            approximate = Approximate.objects.get(name=approximate, seasons=season)
        except Approximate.DoesNotExist:
            print('Approximate "{}" nicht gefunden'.format(approximate))
            return None

    if isinstance(reference, str):
        reference = Reference.get_reference(reference, season)
        category = reference.category
        collective = Collective.objects.get(category=category, seasons=season)

    if reference is None:
        try:
            session = Session.objects.get(guide=guide, session__start_date=start_date, collective=collective)
            event = session.session
            reference = event.reference
            category = reference.category
            collective = Collective.objects.get(category=category, seasons=season)
        except Session.DoesNotExist:
            session = None
    else:
        session = Session.objects.get(session__reference=reference, collective=collective)
        event = session.session
        category = reference.category
        collective = Collective.objects.get(category=category, seasons=season)
    if session is None:
        reference = create_reference(collective.category, season=season, collective=True)
        if reference is None:
            return None

        event = Event.objects.create(
            season=season, reference=reference,
            start_date=start_date, start_time=start_time, approximate=approximate,
            end_date=end_date, end_time=end_time,
            title=title, name=name, description=description,
            rendezvous=rendezvous, source=source, location=location,
            link=link, map=map, cover=cover,
            distal=distal, distance=distance, lea=low_emission_adventure, public_transport=public_transport,
        )

        session = Session.objects.create(
            collective=collective,
            guide=guide,
            speaker=speaker,
            skill=skill, fitness=fitness,
            session=event, state=state,
            portal=portal,
            misc_equipment=misc_equipment
        )
    else:
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

        session.guide = guide
        session.skill = skill
        session.fitness = fitness
        session.ladies_only = ladies_only
        session.state = state
        session.portal = portal
        session.misc_equipment = misc_equipment
        session.save()

    if equipments:
        session.equipments = equipments
    else:
        session.equipments.clear()

    if team:
        session.team = team
    else:
        session.team.clear()

    #chapter_name = collective.category.name
    #chapter = Chapter.objects.get(section__part__name="Vorschläge", section__name="Gruppen", name=chapter_name)
    #session.chapter.add(chapter)

    return session
