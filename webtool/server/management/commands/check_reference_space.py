# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count

from server.models import Reference
from server.models.reference import REFERENCE_RANGE, SATELLITE_REFERENCE_RANGE

# Je Kategorie, Saison und Jahresziffer: öffentliche Codes bleiben zweistellig
# (BGT-701 .. BGT-799), Satelliten (Anmeldeschluss, Vorbesprechung, Kurstermin)
# werden nie veröffentlicht und dürfen dreistellig werden (KT9-7100).
PUBLIC_CAPACITY = len(REFERENCE_RANGE)
SATELLITE_CAPACITY = len(SATELLITE_REFERENCE_RANGE)


class Command(BaseCommand):

    help = (
        'Report how full the booking code space is, per season, category and year '
        'digit. A public category holds {} codes there, a satellite category '
        '(deadline, preliminary, meeting) {}. Once they are gone no further event can '
        'be created there.'.format(PUBLIC_CAPACITY, SATELLITE_CAPACITY)
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--season', default=None,
            help='Limit the report to one season, e.g. 2026'
        )
        parser.add_argument(
            '--threshold', type=int, default=50,
            help='Exit with an error if a row is at or above this percentage (default 50)'
        )

    def handle(self, *args, **options):
        season = options['season']
        threshold = options['threshold']

        queryset = Reference.objects.all()
        if season:
            queryset = queryset.filter(season__name=str(season))

        rows = []
        for row in (
            queryset
            .values('season__name', 'category__code', 'prefix',
                    'category__deadline', 'category__preliminary', 'category__meeting')
            .annotate(used=Count('pk'))
        ):
            satellite = row['category__deadline'] or row['category__preliminary'] or row['category__meeting']
            capacity = SATELLITE_CAPACITY if satellite else PUBLIC_CAPACITY
            rows.append((row['season__name'], row['category__code'], row['prefix'], row['used'], capacity))

        if not rows:
            self.stdout.write('no booking codes found')
            return

        # Fullest first.
        rows.sort(key=lambda row: row[3] / row[4], reverse=True)

        breached = []
        for season_name, code, prefix, used, capacity in rows:
            percent = 100.0 * used / capacity
            line = '{}  {:4s}  {}  {:4d}/{:<4d}  {:5.1f}%'.format(
                season_name, code, prefix, used, capacity, percent
            )
            if percent >= threshold:
                breached.append(line)
                self.stdout.write(self.style.WARNING(line))
            else:
                self.stdout.write(line)

        if breached:
            raise CommandError(
                '{} row(s) at or above {}% of their capacity.'.format(len(breached), threshold)
            )
