# -*- coding: utf-8 -*-
from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

import datetime

from django.core.management.base import BaseCommand

from server.models import Instruction, Tour, Talk, Session, Season


class Command(BaseCommand):
    leave_locale_alone = True
    help = 'Update activities regarding the current date. Switch activities to "Done"'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

    def handle(self, *args, **options):

        season = Season.objects.get(current=True)

        canceled = season.state_list.get(name='Ausgefallen')
        completed = season.state_list.get(name='Durchgeführt')
        not_touch = (canceled.id, completed.id)

        today = datetime.date.today()

        for instruction in Instruction.objects.filter(topic__seasons=season).exclude(state_id__in=not_touch):
            event = instruction.instruction
            event_done = ((event.end_date is None and event.start_date < today) or
                          (event.end_date and event.end_date < today))
            if event_done:
                instruction.state = completed
                instruction.save()
                instruction.instruction.save()
                for event in instruction.meeting_list.all():
                    event.save()

        for tour in Tour.objects.filter(tour__season=season).exclude(state_id__in=not_touch):
            event = tour.tour
            event_done = ((event.end_date is None and event.start_date < today) or
                          (event.end_date and event.end_date < today))
            if event_done:
                tour.state = completed
                tour.save()
                tour.deadline.save()
                if tour.preliminary:
                    tour.preliminary.save()
                tour.tour.save()

        for talk in Talk.objects.filter(talk__season=season).exclude(state_id__in=not_touch):
            event = talk.talk
            event_done = ((event.end_date is None and event.start_date < today) or
                          (event.end_date and event.end_date < today))
            if event_done:
                talk.state = completed
                talk.save()
                talk.talk.save()

        for session in Session.objects.filter(collective__seasons=season).exclude(state_id__in=not_touch):
            event = session.session
            event_done = ((event.end_date is None and event.start_date < today) or
                          (event.end_date and event.end_date < today))
            if event_done:
                session.state = completed
                session.save()
                session.session.save()
