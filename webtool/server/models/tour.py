# -*- coding: utf-8 -*-
import io
from django.db import models
from django.template.defaultfilters import date, time

from .event import Event
from .mixins import QualificationMixin, EquipmentMixin, GuidedEventMixin, AdminMixin, SeasonMixin, ChapterMixin
from .mixins import RequirementMixin, AdmissionMixin
from .time_base import TimeMixin
from . import fields


class TourManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        tour = Event.objects.get_by_natural_key(season, reference)
        return tour.tour


class Tour(
    SeasonMixin, TimeMixin, QualificationMixin, EquipmentMixin, GuidedEventMixin, ChapterMixin,
    AdminMixin, RequirementMixin, AdmissionMixin, models.Model
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

    def natural_key(self):
        return self.season.name, self.tour.reference

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
        return self.deadline.short_date(with_year=with_year)

    def _preliminary(self):
        if self.preliminary:
            season_year = int(self.season.name)
            with_year = self.preliminary.start_date.year != season_year
            preliminary = self.preliminary.short_date(with_year=with_year)
            if self.preliminary.start_time.minute:
                start_time = time(self.preliminary.start_time, "G.i")
            else:
                start_time = time(self.preliminary.start_time, "G")
            return 'Vorbesprechung', "{}, {} Uhr".format(preliminary, start_time)
        elif self.info:
            return 'Toureninformation', self.info
        else:
            return '', ''

    def _tour_date(self):
        season_year = int(self.season.name)
        with_year = self.tour.start_date.year != season_year or (self.tour.end_date and self.tour.end_date.year != season_year)
        return self.tour.long_date(with_year=with_year)

    def _title(self):
        return "{} ({})".format(self.tour.title, self.category_list())

    def description(self):
        """
            Datum: {tour_date}.
            Hinweis: Bus, Bahn, Bike
            Hinweis: LEA
            {title}
            Buchungscode: {reference}
            {name}
            Ausrüstung: {equipment}
            Anforderungen: {skill} , {fitness}
            Vorausgesetzte Kursinhalte: {qualifications}
            Spezielle Voraussetzungen: {preconditions}
            Abfahrt: {start_date}, {start_time}, {rendezvous}, Heimkehr am {end_date} gegen {end_time} Uhr
            Ausgangspunkt: {source}
            Übernachtung: {location}
            Beschreibung: {description}
            Anmeldung bis zum {deadline}, Mindestens {min_quantity}, Maximal {max_quantity} Teilnehmer.
            Vorbesprechung: {preliminary_date}, {preliminary_time} Uhr
            Toureninformation: {info}
            Organisation: {guides}
            Vorauszahlung: {advances} € {advances_info}
            Teilnehmergebühr: {admission} € {admission_info}
            Zusatzkosten: {extra_charges}
            Fahrtkostenbeteiligung: ca. {travel_cost} € für {distance} km
        """
        output = []

        if self.tour.lea:
            output.append('Hinweis: LEA')
        elif self.tour.public_transport:
            output.append('Hinweis: Bus, Bahn, Bike')

        tour_date = "Datum: {}".format(self._tour_date())
        output.append(tour_date)

        title = self._title()
        output.append(title)

        reference = "Buchungscode: {}".format(self.tour.reference)
        output.append(reference)

        long_title = "Langtitel: {}".format(self.tour.name)
        output.append(long_title)

        equipment = "Ausrüstung: {}".format(self.equipment_list())
        output.append(equipment)

        requirements = "Anforderungen: Technik {}, Kondition {}".format(self.skill.code, self.fitness.code)
        output.append(requirements)

        if self.qualifications.exists():
            qualifications = "Vorausgesetzte Kursinhalte: {}".format(self.qualification_list())
            output.append(qualifications)

        if self.preconditions:
            preconditions = "Spezielle Voraussetzungen: {}".format(self.preconditions)
            output.append(preconditions)

        departure = "Abfahrt: {}".format(self.tour.departure())
        output.append(departure)

        if self.tour.source:
            source = "Ausgangspunkt: {}".format(self.tour.source)
            output.append(source)

        if self.tour.location:
            location = "Übernachtung: {}".format(self.tour.location)
            output.append(location)

        description = "Beschreibung: {}".format(self.tour.description)
        output.append(description)

        deadline = "Anmeldung bis zum {}, mindestens {}, maximal {} Teilnehmer".format(
            self._deadline(), self.min_quantity, self.max_quantity
        )
        output.append(deadline)

        if self.preliminary:
            preliminary = "{}: {}".format(*self._preliminary())
            output.append(preliminary)

        guides = "Organisation: {}".format(self.guides())
        output.append(guides)

        advances = ''
        if self.advances:
            advances = "Vorauszahlung: {} €{}".format(int(self.advances), " {}".format(self.advances_info) if self.advances_info else '')
            output.append(advances)

        admission = "Teilnehmergebühr: {} €".format(int(self.admission))
        if advances:
            admission = (
                "{}, im Teilnehmerbeitrag ist eine Vorauszahlung von {} € enthalten. "
                "Diese Vorauszahlung wird bei Stornierung der Teilnahme nur zurückerstattet, wenn der freigewordene Platz wieder besetzt werden kann"
            ).format(admission, int(self.advances))
        output.append(admission)

        if self.extra_charges:
            extra_charges = "Zusatzkosten: {} für {}".format(self.extra_charges, self.extra_charges_info)
            output.append(extra_charges)

        if self.tour.distance:
            travel_cost = "Fahrtkostenbeteiligung: ca. {} € für {} km".format(int(0.07 * float(self.tour.distance)), self.tour.distance)
            output.append(travel_cost)

        return output

    def calendar(self):
        """
            Buchungscode: {reference} {tour_date}, {title}
            {name}
            Ausrüstung: {equipment}
            Anforderungen: {skill} , {fitness}
            Spezielle Voraussetzungen: {preconditions}
            Abfahrt: {start_date}, {start_time}, {rendezvous}, Heimkehr am {end_date} gegen {end_time} Uhr
            Ausgangspunkt: {source}
            Übernachtung: {location}
            Anmeldung bis zum {deadline}, Mindestens {min_quantity}, Maximal {max_quantity} Teilnehmer.
            Vorbesprechung: {preliminary_date}, {preliminary_time} Uhr
            Toureninformation: {info}
            Organisation: {guides}
            Vorauszahlung: {advances} € {advances_info}
            Teilnehmergebühr: {admission} € {admission_info}
            Zusatzkosten: {extra_charges}
            Fahrtkostenbeteiligung: ca. {travel_cost} € für {distance} km
        """
        output = []

        reference = "{} {}, {}".format(self.tour.reference, self.tour.title, self._tour_date())
        output.append(reference)

        name = "Langtitel: {}".format(self.tour.name)
        output.append(name)

        #equipment = "Ausrüstung: {}".format(self.equipment_list())
        #output.append(equipment)

        requirements = "Anforderungen: Technik {}, Kondition {}".format(self.skill.code, self.fitness.code)
        output.append(requirements)

        if self.preconditions:
            preconditions = "Spezielle Voraussetzungen: {}".format(self.preconditions)
            output.append(preconditions)

        departure = "Abfahrt: {}".format(self.tour.departure())
        output.append(departure)

        if self.tour.source:
            source = "Ausgangspunkt: {}".format(self.tour.source)
            output.append(source)

        if self.tour.location:
            location = "Übernachtung: {}".format(self.tour.location)
            output.append(location)

        #description = "Beschreibung: {}".format(self.tour.description)
        #output.append(description)

        deadline = "Anmeldung bis zum {}, mindestens {}, maximal {} Teilnehmer".format(
            self._deadline(), self.min_quantity, self.max_quantity
        )
        output.append(deadline)

        if self.preliminary:
            preliminary = "{}: {}".format(*self._preliminary())
            output.append(preliminary)

        guides = "Organisation: {}".format(self.guides())
        output.append(guides)

        advances = ''
        if self.advances:
            advances = "Vorauszahlung: {} €{}".format(int(self.advances), " {}".format(self.advances_info) if self.advances_info else '')
            output.append(advances)

        admission = "Teilnehmergebühr: {} €".format(int(self.admission))
        if advances:
            admission = (
                "{}, im Teilnehmerbeitrag ist eine Vorauszahlung von {} € enthalten."
            ).format(admission, int(self.advances))
        output.append(admission)

        #if self.extra_charges:
        #    extra_charges = "Zusatzkosten: {}".format(self.extra_charges)
        #    output.append(extra_charges)

        if self.tour.distance:
            travel_cost = "Fahrtkostenbeteiligung: ca. {} € für {} km".format(int(0.07 * float(self.tour.distance)), self.tour.distance)
            output.append(travel_cost)

        return output

    def subject(self):
        return ""

    def details(self):
        """
            {name}
            Vorausgesetzte Kursinhalte: {qualifications}
            Abfahrt: {start_date}, {start_time}, {rendezvous}, Heimkehr am {end_date} gegen {end_time} Uhr
            Ausgangspunkt: {source}
            Übernachtung: {location}
            Beschreibung: {description}
            Anmeldung bis zum {deadline}, Mindestens {min_quantity}, Maximal {max_quantity} Teilnehmer.
            Vorbesprechung: {preliminary_date}, {preliminary_time} Uhr
            Toureninformation: {info}
            Organisation: {guides}
            Vorauszahlung: {advances} € {advances_info}
            Teilnehmergebühr: {admission} € {admission_info}
            Zusatzkosten: {extra_charges} € {extra_charges_info}
            Fahrtkostenbeteiligung: ca. {travel_cost} € für {distance} km
        """
        output = io.StringIO()

        output.write('<h3>{}</h3>'.format(self.tour.name))
        output.write('<p>{}</p>'.format(self.tour.description))

        if self.qualifications.exists():
            output.write('<div class="additional">')
            qualifications = [
                "<p>Für die Teilnahme an dieser Tour ist die Beherrschung folgender "
                "Kursinhalte Voraussetzung:<br /><ul>"
            ]
            for qualification in self.qualifications.all().values_list('category__name', flat=True):
                qualifications.append("<li>{}</li>".format(qualification))
            qualifications.append("</ul></p>")
            output.write(''.join(qualifications))
            output.write('</div>')

        output.write('<p>')
        lines = ['<strong>Abfahrt:</strong> {}'.format(self.tour.departure())]
        if self.tour.source:
            lines.append('<strong>Ausgangspunkt:</strong> {}'.format(self.tour.source))
        if self.tour.location:
            lines.append('<strong>Übernachtung:</strong> {}'.format(self.tour.location))
        output.write('<br />'.join(lines))
        output.write('</p>')

        output.write('<div class="additional"><p>')
        lines = [
            "Anmeldung bis zum {}, mindestens {}, maximal {} Teilnehmer".format(
                self._deadline(), self.min_quantity, self.max_quantity
            )
        ]
        preliminary = self._preliminary()
        if preliminary[0]:
            lines.append("{}: {}".format(*preliminary))
        output.write('<br />'.join(lines))
        output.write('</p></div>')

        output.write('<p>')
        lines = []
        if self.advances:
            advances = "<strong>Vorauszahlung:</strong> {} €{}".format(
                int(self.advances), " für {}".format(self.advances_info) if self.advances_info else ''
            )
            lines.append(advances)
        lines.append("<strong>Teilnehmergebühr:</strong> {} €".format(int(self.admission)))
        if self.extra_charges:
            extra_charges = "<strong>Zusatzkosten:</strong> {} €{}".format(
                self.extra_charges, " für {}".format(self.extra_charges_info) if self.extra_charges_info else ''
            )
            lines.append(extra_charges)
        if self.tour.distance:
            travel_cost = "<strong>Fahrtkostenbeteiligung:</strong> ca. {} € für ungefähr {} km".format(
                int(0.07 * float(self.tour.distance)), self.tour.distance
            )
            lines.append(travel_cost)
        lines.append('<strong>Organisation:</strong> {}'.format(self.guides()))
        output.write('<br />'.join(lines))
        output.write('</p>')

        if self.advances:
            output.write('<div class="additional">')
            advances = (
                "<p>Im Teilnehmerbeitrag von {} € ist eine Vorauszahlung von {} € enthalten. "
                "Diese Vorauszahlung wird bei Stornierung der Teilnahme nur zurückerstattet, wenn der freigewordene "
                "Platz wieder besetzt werden kann.</p>"
            ).format(self.admission, int(self.advances))
            output.write(advances)
            output.write('</div>')

        output.write('<p>'
                     '<a href="https://www.dav-kempten.de/aktivitaeten/teilnahmebedingungen/" '
                     'title="Teilnamebedingungen">Teilnamebedingungen</a>'
                     ' - '
                     '<a href="https://www.dav-kempten.de/aktivitaeten/stornobedingungen/" '
                     'title="Stornobedingungen">Stornobedingungen</a>'
                     '</p>'
        )

        return output.getvalue()

