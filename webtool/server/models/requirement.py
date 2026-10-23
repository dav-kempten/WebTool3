# -*- coding: utf-8 -*-
import datetime

from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count

from . import defaults, fields
from .mixins import SeasonMixin
from .time_base import TimeMixin


class RequirementManager(models.Manager):

    def get_by_natural_key(self, season, kind, category):
        return self.get(season__name=season, kind=kind, category__code=category)


class Requirement(SeasonMixin, TimeMixin, models.Model):
    """Wie viele Veranstaltungen einer Art in einer Saison gebraucht werden.

    Touren hängen an ihrer Kategorie (Skitour, Schneeschuhtour …), Kurse an der
    Kategorie ihres Kursinhalts -- ein Topic hat seine Kategorie als
    Primärschlüssel. Eine Kategorie plus `kind` bildet darum beide Seiten ab.

    Der Bedarf darf eine Spanne sein ("Grundkurs LVS: 10-12"); dann steht die
    Untergrenze in `minimum` und die Obergrenze in `maximum`.
    """

    TOUR = 'tour'
    INSTRUCTION = 'instruction'
    KIND_CHOICES = (
        (INSTRUCTION, 'Kurs'),
        (TOUR, 'Tour'),
    )
    KIND_LABELS = {INSTRUCTION: 'Kurse', TOUR: 'Touren'}

    # Das Programmjahr ist die Saison: beide laufen vom 1. Dezember bis zum
    # 30. November, siehe `defaults.season_year`.
    PROGRAM_START_MONTH = defaults.SEASON_START_MONTH

    # Ab Oktober zeigt die Anzeige auf das Programm, das im Dezember beginnt:
    # zwei Monate Vorlauf, weil im Herbst der kommende Winter geplant wird.
    # Darum folgt sie nicht einfach `Season.current` -- die schaltet erst am
    # 1. Dezember um, wenn die Planung längst läuft.
    PLANNING_LEAD_MONTH = 10

    objects = RequirementManager()

    kind = models.CharField(
        'Art',
        max_length=11,
        db_index=True,
        choices=KIND_CHOICES,
        default=TOUR,
        help_text="Zählt der Bedarf Kurse oder Touren?",
    )

    # noinspection PyUnresolvedReferences
    category = models.ForeignKey(
        'Category',
        db_index=True,
        verbose_name='Kategorie',
        related_name='requirement_list',
        on_delete=models.PROTECT,
        help_text="Bei Kursen die Kategorie des Kursinhalts, bei Touren die Tourenkategorie",
    )

    minimum = models.PositiveSmallIntegerField(
        'Bedarf',
        blank=True, default=0,
        help_text="Wie viele Veranstaltungen mindestens gebraucht werden. 0 = kein Bedarf hinterlegt",
    )

    maximum = models.PositiveSmallIntegerField(
        'Bedarf (Obergrenze)',
        blank=True, null=True,
        help_text="Nur ausfüllen, wenn der Bedarf eine Spanne ist, z.B. 10-12",
    )

    order = fields.OrderField(help_text="Reihenfolge in der Bedarfsanzeige")

    def natural_key(self):
        return self.season.name, self.kind, self.category.code

    natural_key.dependencies = ['server.season', 'server.category']

    @property
    def topic(self):
        """Der Kursinhalt dieser Kategorie, falls es einen gibt."""
        Topic = apps.get_model('server', 'Topic')
        try:
            return self.category.category_topic
        except Topic.DoesNotExist:
            return None

    @property
    def label(self):
        """Die Bezeichnung, unter der die Anzeige den Bedarf führt."""
        if self.kind == self.INSTRUCTION:
            topic = self.topic
            if topic is not None:
                return topic.title
        return self.category.name

    @property
    def upper(self):
        """Die Obergrenze -- ohne Spanne ist sie der Bedarf selbst."""
        return self.maximum if self.maximum is not None else self.minimum

    def clean(self):
        if self.maximum is not None and self.maximum < self.minimum:
            raise ValidationError({'maximum': 'Die Obergrenze darf nicht kleiner als der Bedarf sein.'})

    def __str__(self):
        span = str(self.minimum) if self.upper == self.minimum else '{}-{}'.format(self.minimum, self.maximum)
        return "{}: {} [{}]".format(self.label, span, self.season)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Bedarf"
        verbose_name_plural = "Bedarfe"
        unique_together = ('season', 'kind', 'category')
        ordering = ('kind', 'order', 'category__order', 'category__name')

    # -- Auswertung -------------------------------------------------------

    @classmethod
    def window_for_year(cls, year):
        """Der Zeitraum des Programmjahrs `year`, als [von, bis).

        Programmjahr 2027 heißt 1.12.2026 bis 30.11.2027: eine Skitour im
        Januar 2026 gehört zum vorigen Programm, eine im Januar 2027 zu diesem.
        """
        return (
            datetime.date(year - 1, cls.PROGRAM_START_MONTH, 1),
            datetime.date(year, cls.PROGRAM_START_MONTH, 1),
        )

    @classmethod
    def program_window(cls, season):
        """Der Zeitraum, den der Bedarf dieser Saison abdeckt."""
        return cls.window_for_year(int(season.name))

    @classmethod
    def program_year(cls, today=None):
        """Das Programmjahr, das gerade läuft oder als nächstes geplant wird.

        Bewusst nicht aus `Season.current` abgeleitet: der Saisonwechsel liegt
        auf dem 1. Januar und spränge damit mitten im Winter weiter -- im
        Januar zeigte die Anzeige plötzlich das übernächste Programm.
        """
        today = today or datetime.date.today()
        return today.year + 1 if today.month >= cls.PLANNING_LEAD_MONTH else today.year

    @classmethod
    def planning_season(cls, today=None):
        """Die Saison, deren Bedarf die Anzeige führt, oder None.

        Legt nichts an: `Season.for_year` würde die Saison erzeugen, und das
        gehört nicht in eine lesende Anfrage. Fehlt sie, ist schlicht noch kein
        Bedarf gepflegt.
        """
        Season = apps.get_model('server', 'Season')
        return Season.objects.filter(name=str(cls.program_year(today))).first()

    @classmethod
    def actual_counts(cls, season, kind):
        """Zahl der eingestellten Veranstaltungen je Kategorie, als {id: n}.

        Maßgeblich ist das Startdatum im Programmjahr, nicht `Event.season`:
        die Saison folgt dem Startjahr und teilt damit jeden Winter. Nebenbei
        zählt so auch eine Veranstaltung richtig mit, deren Saisonzuordnung
        noch nicht nachgezogen ist (siehe `realign_seasons`).

        Gezählt wird alles, was angelegt ist -- unabhängig vom Bearbeitungs-
        stand, denn der Bedarf fragt nach dem Planungsstand. Draußen bleiben
        gelöschte (deprecated), ausgefallene und interne Veranstaltungen.
        """
        start, end = cls.program_window(season)

        if kind == cls.TOUR:
            model = apps.get_model('server', 'Tour')
            rows = (
                model.objects
                .filter(
                    tour__start_date__gte=start, tour__start_date__lt=end,
                    deprecated=False, tour__internal=False,
                )
                .exclude(state__canceled=True)
                .values('tour__reference__category')
                .annotate(total=Count('pk'))
            )
            return {row['tour__reference__category']: row['total'] for row in rows}

        model = apps.get_model('server', 'Instruction')
        rows = (
            model.objects
            .filter(
                instruction__start_date__gte=start, instruction__start_date__lt=end,
                deprecated=False, instruction__internal=False,
            )
            .exclude(state__canceled=True)
            .values('topic')
            .annotate(total=Count('pk'))
        )
        # Ein Topic hat seine Kategorie als Primärschlüssel, topic_id == category_id.
        return {row['topic']: row['total'] for row in rows}

    @classmethod
    def overview(cls, season):
        """Bedarf und Ist-Stand der Saison, nach Kursen und Touren gruppiert.

        `entries` führt jede Art mit hinterlegtem Bedarf, `unplanned` jede Art
        ohne Vorgabe, in der trotzdem etwas eingestellt ist -- so fällt auf, was
        neben der Planung läuft, ohne die Summen zu verfälschen. Der Bedarfs-
        stand einer Gruppe rechnet allein über `entries`; sonst würden z.B. die
        Sommertouren einen Winterbedarf als erfüllt erscheinen lassen.

        Der gezählte Zeitraum steht mit in der Antwort, damit die Anzeige ihn
        benennen kann -- die Saisonbezeichnung allein wäre irreführend, weil das
        Programmjahr nicht das Kalenderjahr ist (siehe `program_window`).
        """
        start, end = cls.program_window(season)
        requirements = (
            cls.objects
            .filter(season=season, deprecated=False)
            .select_related('category', 'category__category_topic')
        )
        by_kind = {cls.INSTRUCTION: [], cls.TOUR: []}
        for requirement in requirements:
            by_kind[requirement.kind].append(requirement)

        groups = []
        for kind, _ in cls.KIND_CHOICES:
            counts = cls.actual_counts(season, kind)
            entries = []
            planned = set()
            for requirement in by_kind[kind]:
                if requirement.minimum == 0:
                    continue
                planned.add(requirement.category_id)
                entries.append(dict(
                    id=requirement.pk,
                    categoryId=requirement.category_id,
                    code=requirement.category.code,
                    name=requirement.label,
                    minimum=requirement.minimum,
                    maximum=requirement.upper,
                    actual=counts.get(requirement.category_id, 0),
                    order=requirement.order,
                ))
            entries.sort(key=lambda entry: (entry['order'], entry['name']))

            unplanned = cls._unplanned(kind, counts, planned)
            unplanned.sort(key=lambda entry: (-entry['actual'], entry['name']))

            groups.append(dict(
                kind=kind,
                label=cls.KIND_LABELS[kind],
                entries=entries,
                unplanned=unplanned,
                minimum=sum(entry['minimum'] for entry in entries),
                maximum=sum(entry['maximum'] for entry in entries),
                actual=sum(entry['actual'] for entry in entries),
            ))
        return cls._payload(season.name, start, end, groups)

    @classmethod
    def empty_overview(cls, year):
        """Die Antwort für ein Programmjahr, dessen Saison es noch nicht gibt."""
        start, end = cls.window_for_year(year)
        groups = [
            dict(kind=kind, label=cls.KIND_LABELS[kind], entries=[], unplanned=[],
                 minimum=0, maximum=0, actual=0)
            for kind, _ in cls.KIND_CHOICES
        ]
        return cls._payload(str(year), start, end, groups)

    @staticmethod
    def _payload(season_name, start, end, groups):
        return dict(
            season=season_name,
            periodStart=start,
            periodEnd=end - datetime.timedelta(days=1),  # einschließlich, für die Anzeige
            groups=groups,
        )

    @classmethod
    def _unplanned(cls, kind, counts, planned):
        """Arten mit Veranstaltungen, für die kein Bedarf hinterlegt ist.

        Ein Bedarf von 0 zählt dabei als nicht hinterlegt: die Zeilen entstehen
        massenhaft aus `init_requirements` und sollen die Anzeige nicht als
        erfüllte Vorgabe verlassen.
        """
        missing = [category_id for category_id, total in counts.items()
                   if total and category_id not in planned]
        if not missing:
            return []
        Category = apps.get_model('server', 'Category')
        Topic = apps.get_model('server', 'Topic')
        categories = Category.objects.filter(pk__in=missing).select_related('category_topic')
        entries = []
        for category in categories:
            name = category.name
            if kind == cls.INSTRUCTION:
                try:
                    name = category.category_topic.title
                except Topic.DoesNotExist:
                    pass
            entries.append(dict(
                id=None,
                categoryId=category.pk,
                code=category.code,
                name=name,
                minimum=0,
                maximum=0,
                actual=counts[category.pk],
                order=category.order,
            ))
        return entries
