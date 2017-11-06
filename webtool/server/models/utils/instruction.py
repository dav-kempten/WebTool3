# -*- coding: utf-8 -*-
from decimal import Decimal
from django.utils.dateparse import parse_date, parse_time

from .. import Season, Approximate, Reference, Instruction, Event, Guide, Topic
from .. import defaults
from . import create_reference


def create_meeting(
    instruction,
    meeting=None,
    title=None, name=None,
    start_date=None, start_time=None,
    approximate=None,
    end_date=None, end_time=None,
    description='',
    rendezvous='', location='', source='',
    link='', map='',
    distal=None, distance=0, public_transport=False,
    reference=None
):
    meeting.instruction = instruction
    return meeting


def create_instruction(
    start_date, start_time=None,
    title=None, name=None,
    approximate=None,
    end_date=None, end_time=None,
    description='',
    rendezvous='', location='', source='',
    link='', map='', cover='',
    distal=None, distance=0, public_transport=False, low_emission_adventure=False, ladies_only=False,
    guide=None,
    team=None,
    state=None,
    min_quantity=3, max_quantity=6,
    admission=None, advances=None, advances_info='', extra_charges=None, extra_charges_info='',
    topic=None,
    meetings = None,
    season=None,
    message='',
    comment='',
    budget_info='',
    reference=None
):

    if isinstance(season, str):
        season = Season.objects.get(name=season)

    if season is None:
        season = defaults.get_default_season()

    if isinstance(topic, str):
        topic = Topic.objects.get(category__code=topic, seasons=season)
        category = topic.category

    if title is None:
        title = topic.title

    if name is None:
        name = topic.name

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

    if state is None:
        state = defaults.get_default_state()

    if isinstance(start_date, str):
        start_date = parse_date(start_date)

    if isinstance(start_time, str):
        start_time = parse_time(start_time)
    if not start_time:
        start_time = None

    if isinstance(approximate, str):
        try:
            approximate = Approximate.objects.get(name=approximate, seasons=season)
        except Approximate.DoesNotExist:
            print('Approximate "{}" nicht gefunden'.format(approximate))
            return None

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

    if isinstance(reference, str):
        reference = Reference.get_reference(reference, season)
        category = reference.category

    if reference is None:
        try:
            instruction = Instruction.objects.get(guide=guide, instruction__start_date=start_date)
            topic = instruction.topic
            event = instruction.instruction
            reference = event.reference
            category = reference.category
        except Instruction.DoesNotExist:
            instruction = None
    else:
        instruction = Instruction.objects.get(instruction__reference=reference)
        topic = instruction.topic
        event = instruction.instruction
        category = reference.category

    if instruction is None:
        reference = create_reference(category, season=season, topic=True)
        if reference is None:
            return None
        category = reference.category

        event = Event.objects.create(
            season=season, reference=reference,
            start_date=start_date, start_time=start_time, approximate=approximate,
            end_date=end_date, end_time=end_time,
            title=title, name=name, description=description,
            rendezvous=rendezvous, source=source, location=location,
            link=link, map=map, cover=cover,
            distal=distal, distance=distance, lea=low_emission_adventure, public_transport=public_transport,
        )

        instruction = Instruction.objects.create(
            topic=topic,
            guide=guide,
            instruction=event, state=state,
            admission=admission,
            advances=advances, advances_info=advances_info,
            extra_charges=extra_charges, extra_charges_info=extra_charges_info,
            min_quantity=min_quantity, max_quantity=max_quantity,
            ladies_only=ladies_only,
            comment=comment,
            budget_info=budget_info,
            message=message,
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

        instruction.guide = guide
        instruction.state = state
        instruction.admission = admission
        instruction.advances = advances
        instruction.advances_info = advances_info
        instruction.extra_charges = extra_charges
        instruction.extra_charges_info = extra_charges_info
        instruction.min_quantity = min_quantity
        instruction.max_quantity = max_quantity
        instruction.ladies_only = ladies_only
        instruction.comment = comment
        instruction.budget_info = budget_info
        instruction.message = message
        instruction.save()

    if team:
        instruction.team = team
    else:
        instruction.team.clear()

    if meetings is None:
        meetings = Event.objects.filter(instruction=instruction)

    for meeting in meetings:
        if isinstance(meeting, Event):
            create_meeting(instruction, meeting=meeting)
        else:
            create_meeting(instruction, **meeting)

    #chapter_name = category.name
    #chapter = Chapter.objects.get(section__part__name="Vorschläge", section__name="Touren", name=chapter_name)
    #tour.chapter.add(chapter)

    return instruction


def test():

    values = [
        # {
        #     "topic": "LVS",
        #     "title": "",
        #     "name": "",
        #     "description": "",
        #     "start_date": "2018-12-01",
        #     "start_time": "09:30",
        #     "end_time": "15:00",
        #     "rendezvous": "Parkplatz oberhalb des Eschacher Weiher",
        #     "guide": "Helmut-Schneider",
        #     "team": "Wolfgang-Doll",
        #     "min_quantity": 1,
        #     "max_quantity": 16,
        #     "admission": "5.00",
        # },
        {
            "topic": "BKS",
            "title": "",
            "name": "",
            "description": "Theorie und Praxis finden im Umkreis der Erfurter Hütte über dem Achensee im Rofangebirge statt.",
            "start_date": "2018-05-18",
            "start_time": None,
            "approximate": "mittags",
            "end_date": "2018-05-21",
            "end_time": "17:00",
            "rendezvous": "swoboda alpin",
            "location": "Erfurter Hütte",
            "source": "Maurach",
            "link": "",
            "map": "",
            "cover": "",
            "distance": 370,
            "public_transport": False,
            "low_emission_adventure": False,
            "ladies_only": False,
            "guide": "Wolfgang-Doll",
            "team": "Daniela-Rothermel",
            "min_quantity": 7,
            "max_quantity": 14,
            "admission": "73.00",
            "advances": "20.00",
            "advances_info": "Anzahlung Hütte",
            "extra_charges": "80",
            "extra_charges_info": "Mehrbettzimmer, Frühstück vom Buffet",
        },
    ]
    create_instruction(**values[0])
