# -*- coding: utf-8 -*-
import io
from django.db import models

from .event import Event
from .mixins import QualificationMixin, EquipmentMixin, GuidedEventMixin, AdminMixin, SeasonMixin, ChapterMixin
from .mixins import RequirementMixin, AdmissionMixin, OnlineMixin
from .time_base import TimeMixin
from . import fields, homepage


class TourManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        tour = Event.objects.get_by_natural_key(season, reference)
        return tour.tour


class Tour(
    TimeMixin, QualificationMixin, EquipmentMixin, GuidedEventMixin, ChapterMixin,
    AdminMixin, RequirementMixin, AdmissionMixin, OnlineMixin, models.Model
):

    # Check: categories.season and self.season belongs to the same season!
    # Check: deadline <= preliminary < tour
    # Check: tour.category not part of categories

    objects = TourManager()

    # noinspection PyUnresolvedReferences
    categories = models.ManyToManyField(
        'Category',
        db_index=True,
        verbose_name='Weitere Kategorien',
        related_name='+',
        blank=True,
    )

    # misc_category is only valid if category is '?'

    misc_category = models.CharField(
        'Sonstiges',
        max_length=75,
        blank=True, default='',
        help_text="Kategoriebezeichnung, wenn unter Kategorie „Sonstiges“ gewählt wurde",
    )

    ladies_only = models.BooleanField(
        'Von Frauen für Frauen',
        default=False,
    )

    youth_on_tour = models.BooleanField(
        'Jugend on Tour',
        default=False,
    )

    relaxed = models.BooleanField(
        'Gemütliche Tour',
        default=False
    )

    mountain_bus = models.BooleanField(
        'Bergbus',
        default=False
    )

    deadline = models.OneToOneField(
        Event,
        verbose_name='Anmeldeschluss',
        related_name='deadline',
        on_delete=models.PROTECT,
    )

    preliminary = models.OneToOneField(
        Event,
        verbose_name='Tourenbesprechung',
        related_name='preliminary',
        blank=True, null=True,
        on_delete=models.SET_NULL,
    )

    # info is only valid if preliminary is None

    info = fields.InfoField(
        help_text="Informationen, wenn z.B. keine Tourenbesprechung geplant ist.",
    )

    tour = models.OneToOneField(
        Event,
        primary_key=True,
        verbose_name='Veranstaltung',
        related_name='tour',
        on_delete=models.PROTECT,
    )

    portal = models.URLField(
        'Tourenportal',
        blank=True, default='',
        help_text="Eine URL zum Tourenportal der Alpenvereine",
    )

    @property
    def season(self):
        return self.tour.season

    def natural_key(self):
        return self.season.name, str(self.tour.reference)

    natural_key.dependencies = ['server.season', 'server.event']

    def __str__(self):
        return "{} - {}, {} [{}]".format(self.tour.reference, self.tour.title, self.tour.long_date(with_year=True), self.season)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Gemeinschaftstour"
        verbose_name_plural = "Gemeinschaftstouren"
        ordering = ('tour__start_date', )

    def category_list(self):
        categories = [self.tour.reference.category.code]
        categories += list(self.categories.exclude(code='?').values_list('code', flat=True))
        if self.categories.filter(code='?').exists() and self.misc_category:
            categories.append(self.misc_category)
        return ', '.join(categories)

    def _deadline(self):
        season_year = int(self.season.name)
        with_year = self.deadline.start_date.year != season_year
        return self.deadline.long_date(with_year=with_year)

    def _preliminary(self):
        if self.preliminary:
            preliminary = self.preliminary.departure()
            return 'Vorbesprechung', "{}".format(preliminary)
        elif self.info:
            return 'Toureninformation', self.info
        else:
            return '', ''

    def subject(self):
        return ""

    def details(self):
        """
        Der Text der Tour für die Homepage:

            {name}
            {description}
            Vorausgesetzte Kursinhalte: {qualifications}
            Vorbesprechung: {preliminary} | Toureninformation: {info}
            Abfahrt: {start_date}, {start_time}, {rendezvous}, Heimkehr am {end_date} gegen {end_time} Uhr
            Ausgangspunkt: {source}
            Übernachtung: {location}
            Anmeldung bis zum {deadline}, mindestens {min_quantity}, maximal {max_quantity} Teilnehmer.
            Anzahlung, Teilnahmegebühr, Zusatzkosten, Fahrtkostenbeteiligung, Organisation
            Hinweis, Teilnahme- und Stornobedingungen, Fragen
        """
        output = io.StringIO()

        output.write('<h3>{}</h3>'.format(homepage.text(self.tour.name)))
        output.write('<p>{}</p>'.format(homepage.rich(self.tour.description)))

        if self.qualifications.exists():
            output.write(homepage.qualifications(self.qualifications.values_list('name', flat=True), 'dieser Tour'))

        lines = []
        label, value = self._preliminary()
        if label:
            lines.append(homepage.line(label, homepage.text(value)))
        lines.append(homepage.line('Abfahrt', homepage.text(self.tour.departure(labelled=True))))
        if self.tour.source:
            lines.append(homepage.line('Ausgangspunkt', homepage.text(self.tour.source)))
        if self.tour.location:
            lines.append(homepage.line('Übernachtung', homepage.text(self.tour.location)))
        output.write(homepage.paragraph(lines))

        output.write('<div class="additional">')
        output.write("<p>Anmeldung bis zum {}, mindestens {}, maximal {} {}Teilnehmer.</p>".format(
                self._deadline(), self.min_quantity, self.max_quantity, "weibliche " if self.ladies_only else '')
        )
        output.write('</div>')

        lines = homepage.costs(self, self.tour, always_admission=True)
        lines.append(homepage.line('Organisation', homepage.text(self.guides())))
        output.write(homepage.paragraph(lines))

        output.write(self.remark())
        output.write(homepage.CONDITIONS)
        output.write(homepage.QUESTIONS)

        return output.getvalue()
