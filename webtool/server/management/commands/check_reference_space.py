# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count

from server.models import Reference
from server.models.reference import REFERENCE_RANGE

# 10 Prefixe (0..9) mal die Referenzen 1..99
CAPACITY = len(REFERENCE_RANGE) * 10


class Command(BaseCommand):

    help = (
        'Report how full the booking code space of every (season, category) pair is. '
        'A pair holds {} codes; once they are gone no further event can be created in '
        'that category and season, and create_reference raises '
        'ReferenceSpaceExhausted.'.format(CAPACITY)
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--season', default=None,
            help='Limit the report to one season, e.g. 2026'
        )
        parser.add_argument(
            '--threshold', type=int, default=50,
            help='Exit with an error if a pair is at or above this percentage (default 50)'
        )

    def handle(self, *args, **options):
        season = options['season']
        threshold = options['threshold']

        queryset = Reference.objects.all()
        if season:
            queryset = queryset.filter(season__name=str(season))

        rows = (
            queryset
            .values('season__name', 'category__code')
            .annotate(used=Count('pk'))
            .order_by('-used')
        )

        breached = []
        for row in rows:
            used = row['used']
            percent = 100.0 * used / CAPACITY
            line = '{}  {:4s}  {:4d}/{}  {:5.1f}%'.format(
                row['season__name'], row['category__code'], used, CAPACITY, percent
            )
            if percent >= threshold:
                breached.append(line)
                self.stdout.write(self.style.WARNING(line))
            else:
                self.stdout.write(line)

        if not rows:
            self.stdout.write('no booking codes found')
            return

        if breached:
            raise CommandError(
                '{} (season, category) pair(s) at or above {}% of {} codes.'.format(
                    len(breached), threshold, CAPACITY
                )
            )
