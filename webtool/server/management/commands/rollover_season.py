# -*- coding: utf-8 -*-
import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from server.models import Season


class Command(BaseCommand):

    help = (
        "Make the season of today's year the current one and prepare next year's "
        'season (Season.for_year). Meant to run daily from cron: on 1 January it '
        'switches, on every other day it changes nothing beyond creating a missing '
        "next season. Safe to run any number of times."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--today', default=None,
            help='Pretend today is this date (YYYY-MM-DD), for tests and dry checks'
        )

    def handle(self, *args, **options):
        today = self.parse_today(options['today'])

        with transaction.atomic():
            target = Season.for_year(today.year)
            following = Season.for_year(today.year + 1)

            if target.current:
                self.stdout.write('season {} is already current'.format(target.name))
            else:
                # Erst abwählen, dann setzen: der partielle Unique-Index aus
                # Migration 0002 erlaubt nie zwei aktuelle Saisons gleichzeitig.
                previous = list(Season.objects.filter(current=True).values_list('name', flat=True))
                Season.objects.filter(current=True).update(current=False)
                Season.objects.filter(pk=target.pk).update(current=True)
                self.stdout.write('season {} is now current (was {})'.format(
                    target.name, ', '.join(previous) or 'none'
                ))

        self.stdout.write('season {} is prepared'.format(following.name))

    @staticmethod
    def parse_today(value):
        if not value:
            return datetime.date.today()
        try:
            return datetime.date.fromisoformat(value)
        except ValueError:
            raise CommandError('--today expects YYYY-MM-DD, got {!r}'.format(value))
