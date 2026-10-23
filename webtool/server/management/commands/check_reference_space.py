# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q

from server.models import Reference
from server.models.reference import REFERENCE_RANGE

# Ein öffentlicher Code trägt die Jahresziffer (BGT-6NN), es zählen also nur die
# Nummern 1..99 dieser einen Ziffer. Ein Überlauf in die nächste Ziffer würde ein
# falsches Jahr drucken -- deshalb ist das die eigentliche Grenze.
PUBLIC_CAPACITY = len(REFERENCE_RANGE)
# Satelliten (Anmeldeschluss, Vorbesprechung, Kurstermin) werden nie veröffentlicht
# und dürfen sich über alle zehn Ziffern verteilen.
SATELLITE_CAPACITY = len(REFERENCE_RANGE) * 10

SATELLITE = Q(category__deadline=True) | Q(category__preliminary=True) | Q(category__meeting=True)


class Command(BaseCommand):

    help = (
        'Report how full the booking code space is. A public category holds {} codes '
        'per season and year digit; a satellite category (deadline, preliminary, '
        'meeting) holds {} per season. Once they are gone no further event can be '
        'created there.'.format(PUBLIC_CAPACITY, SATELLITE_CAPACITY)
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

        rows = [
            (row['season__name'], row['category__code'], str(row['prefix']), row['used'], PUBLIC_CAPACITY)
            for row in (
                queryset.exclude(SATELLITE)
                .values('season__name', 'category__code', 'prefix')
                .annotate(used=Count('pk'))
            )
        ] + [
            (row['season__name'], row['category__code'], '*', row['used'], SATELLITE_CAPACITY)
            for row in (
                queryset.filter(SATELLITE)
                .values('season__name', 'category__code')
                .annotate(used=Count('pk'))
            )
        ]

        if not rows:
            self.stdout.write('no booking codes found')
            return

        # Fullest first; '*' in the digit column marks a satellite category.
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
