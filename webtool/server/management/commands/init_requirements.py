# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from server.models import Category, Requirement, Season, Topic


class Command(BaseCommand):

    help = (
        'Lege für eine Saison je Tourenkategorie und je Kursinhalt eine Bedarfszeile '
        'an, zunächst mit Bedarf 0. Die Zahlen werden danach im Django-Admin unter '
        '"Bedarfe" gepflegt. Vorhandene Zeilen bleiben unberührt, der Befehl darf '
        'beliebig oft laufen.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--season', default=None,
            help='Jahreszahl der Saison (Vorgabe: das Programmjahr, das die Anzeige führt)'
        )
        parser.add_argument(
            '--copy-from', default=None,
            help='Jahreszahl einer Saison, deren Bedarfszahlen übernommen werden'
        )

    def handle(self, *args, **options):
        season = self.get_season(options['season'])
        source = self.get_season(options['copy_from']) if options['copy_from'] else None
        previous = self.previous_values(source) if source else {}

        created = 0
        with transaction.atomic():
            for kind, category in self.targets(season):
                values = previous.get((kind, category.pk), {})
                _, is_new = Requirement.objects.get_or_create(
                    season=season, kind=kind, category=category,
                    defaults=dict(
                        minimum=values.get('minimum', 0),
                        maximum=values.get('maximum'),
                        # Die Reihenfolge gehört zur Pflege und wird mit
                        # übernommen; ohne Vorlage die der Kategorie.
                        order=values.get('order', category.order),
                    ),
                )
                created += int(is_new)

        total = Requirement.objects.filter(season=season).count()
        self.stdout.write('Saison {}: {} Bedarfszeilen angelegt, {} insgesamt'.format(
            season.name, created, total
        ))
        if source:
            self.stdout.write('Zahlen übernommen aus Saison {}'.format(source.name))

    @staticmethod
    def targets(season):
        """Jede Tourenkategorie und jeder Kursinhalt der Saison, als (kind, category)."""
        tours = Category.objects.filter(seasons=season, tour=True, deprecated=False)
        for category in tours:
            yield Requirement.TOUR, category

        topics = (
            Topic.objects
            .filter(seasons=season, deprecated=False, internal=False)
            .select_related('category')
        )
        for topic in topics:
            yield Requirement.INSTRUCTION, topic.category

    @staticmethod
    def previous_values(source):
        return {
            (requirement.kind, requirement.category_id): dict(
                minimum=requirement.minimum,
                maximum=requirement.maximum,
                order=requirement.order,
            )
            for requirement in Requirement.objects.filter(season=source, deprecated=False)
        }

    @staticmethod
    def get_season(name):
        # Ohne Angabe das Programmjahr der Bedarfsanzeige, nicht die aktuelle
        # Saison: die beiden fallen im Herbst auseinander (siehe
        # Requirement.program_year).
        if not name:
            name = str(Requirement.program_year())
        try:
            return Season.objects.get(name=name)
        except Season.DoesNotExist:
            raise CommandError(
                'Saison {!r} gibt es nicht. Season.for_year legt sie an, '
                'z.B. über rollover_season.'.format(name)
            )
