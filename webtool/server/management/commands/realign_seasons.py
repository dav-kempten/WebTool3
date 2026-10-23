# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from django.db import transaction

from server.models import Event, Instruction, Reference, Season, Session, Talk, Tour


def event_groups():
    """(kind, main event, satellites) for every tour, course, talk and session."""
    for tour in Tour.objects.select_related('tour__season', 'tour__reference__category'):
        yield 'Tour', tour.tour, [e for e in (tour.deadline, tour.preliminary) if e is not None]
    for course in Instruction.objects.select_related('instruction__season', 'instruction__reference__category'):
        yield 'Kurs', course.instruction, list(Event.objects.filter(instruction=course))
    for talk in Talk.objects.select_related('talk__season', 'talk__reference__category'):
        yield 'Vortrag', talk.talk, []
    for session in Session.objects.select_related('session__season', 'session__reference__category'):
        yield 'Gruppentermin', session.session, []


class Command(BaseCommand):

    help = (
        'Move every tour, course, talk and session whose start year differs from its '
        'season into the season of its start year, together with its satellites '
        '(deadline, preliminary, course meetings). Booking codes keep their string '
        '-- they may be printed already. A group whose code already exists in the '
        'target season is skipped and reported. Without --apply only a report.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Actually move the events')

    def handle(self, *args, **options):
        apply = options['apply']
        moved, skipped = 0, 0
        # Codes this run puts into a target season. Without it the dry run would
        # miss clashes between two legacy events moving into the same season.
        claimed = set()

        # Misplaced: the main event is not in the season of its start year. Moving
        # puts event and Reference row into that season, which also mends groups
        # whose Reference row sat in yet another season (production has 2027
        # courses of season 2026 with code rows in 2025). Older mismatches of the
        # Reference row alone are left as they are.
        misplaced = [
            (kind, main, satellites) for kind, main, satellites in event_groups()
            if main.start_date and main.season.name != str(main.start_date.year)
        ]
        # Two legacy events can carry the same code for one year (production has
        # two GKS-701 for January 2027). The one whose code row matches its event
        # moves first -- the current season resolves that one today -- then the
        # one from the newer season.
        misplaced.sort(
            key=lambda group: (group[1].reference.season_id == group[1].season_id, group[1].season.name),
            reverse=True,
        )

        for kind, main, satellites in misplaced:
            target_name = str(main.start_date.year)
            group = [main, *satellites]
            line = '{} {} (Start {}): Saison {} -> {}'.format(
                kind, main.reference, main.start_date, main.season.name, target_name
            )

            clash = self.clash(group, target_name, claimed)
            if clash:
                skipped += 1
                self.stdout.write(self.style.WARNING(
                    '{} -- übersprungen, {} gibt es in Saison {} schon'.format(line, clash, target_name)
                ))
                continue

            moved += 1
            claimed.update(self.key(event.reference, target_name) for event in group)
            self.stdout.write(line)
            if apply:
                self.move(group, Season.for_year(main.start_date.year))

        if not moved and not skipped:
            self.stdout.write('keine Veranstaltung mit abweichender Saison')
            return
        self.stdout.write('{} {}, {} übersprungen{}'.format(
            moved, 'verschoben' if apply else 'zu verschieben', skipped,
            '' if apply else ' -- Probelauf, mit --apply ausführen',
        ))

    @staticmethod
    def key(reference, season_name):
        return season_name, reference.category_id, reference.prefix, reference.reference

    @classmethod
    def clash(cls, group, target_name, claimed):
        """The first code of `group` that already exists in the target season, or
        that an earlier event of this run is moving there."""
        for event in group:
            reference = event.reference
            if cls.key(reference, target_name) in claimed or Reference.objects.filter(
                season__name=target_name, category=reference.category,
                prefix=reference.prefix, reference=reference.reference,
            ).exclude(pk=reference.pk).exists():
                return str(reference)
        return None

    @staticmethod
    def move(group, season):
        with transaction.atomic():
            for event in group:
                reference = event.reference
                # get_reference only finds categories linked to the season.
                reference.category.seasons.add(season)
                Reference.objects.filter(pk=reference.pk).update(season=season)
                Event.objects.filter(pk=event.pk).update(season=season)
