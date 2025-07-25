# -*- coding: utf-8 -*-
import io
from django.db import models

from . import fields
from .event import Event
from .mixins import DescriptionMixin, QualificationMixin, ChapterMixin, SeasonsMixin
from .mixins import EquipmentMixin, GuidedEventMixin, AdminMixin, AdmissionMixin, OnlineMixin

from .time_base import TimeMixin


class TopicManager(models.Manager):

    def get_by_natural_key(self, category):
        return self.get(category__code=category)


class Topic(SeasonsMixin, TimeMixin, DescriptionMixin, QualificationMixin, EquipmentMixin, models.Model):

    objects = TopicManager()

    # noinspection PyUnresolvedReferences
    category = models.OneToOneField(
        'Category',
        primary_key=True,
        verbose_name='Kategorie',
        related_name='category_topic',
        on_delete=models.PROTECT,
    )

    tariffs = models.ManyToManyField(
        'Tariff',
        db_index=True,
        verbose_name='Preisaufschläge',
        related_name='tariff_list',
        blank=True, default=''
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.category.code,

    natural_key.dependencies = ['server.season', 'server.category']

    def __str__(self):
        return "{} ({}){}".format(self.title, self.category.code, "- internal" if self.internal else "")

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Kursinhalt"
        verbose_name_plural = "Kursinhalte"
        unique_together = ('title', 'internal')
        ordering = ('order', 'name')


class InstructionManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        instruction = Event.objects.get_by_natural_key(season, reference)
        return instruction.meeting


class Instruction(TimeMixin, GuidedEventMixin, AdminMixin, AdmissionMixin, ChapterMixin,
                  QualificationMixin, EquipmentMixin, OnlineMixin, models.Model):

    objects = InstructionManager()

    topic = models.ForeignKey(
        Topic,
        db_index=True,
        verbose_name='Inhalt',
        related_name='instructions',
        on_delete=models.PROTECT,
    )

    instruction = models.OneToOneField(
        Event,
        primary_key=True,
        verbose_name='Veranstaltung',
        related_name='meeting',
        on_delete=models.PROTECT,
    )

    ladies_only = models.BooleanField(
        'Von Frauen für Frauen',
        blank=True, default=False,
    )

    is_special = models.BooleanField(
        'Spezialkurs',
        blank=True, default=False,
        help_text = 'Kreative Kursinhalte'
    )

    # category is valid only, if instruction is_special
    category = models.OneToOneField(
        'Category',
        verbose_name='Sonder Kategorie',
        related_name='special_instruction',
        blank=True, null=True,
        on_delete=models.PROTECT,
    )

    @property
    def season(self):
        return self.instruction.season

    def natural_key(self):
        return self.season.name, str(self.instruction.reference)

    natural_key.dependencies = ['server.season', 'server.event', 'server.topic']

    def __str__(self):
        return "{}{}, {} [{}]".format(
            self.topic.title,
            " ({})".format(self.instruction.name) if self.instruction.name else '',
            self.instruction.long_date(with_year=True),
            self.season
        )

    def subject(self):
        return ""

    def details(self):
        output = io.StringIO()

        output.write('<h3>{}</h3>'.format(self.instruction.name if self.is_special else self.topic.name))
        output.write('<p>{}</p>'.format(self.instruction.description if self.is_special else self.topic.description))

        if (self.is_special and self.qualifications.exists()) or (not self.is_special and self.topic.qualifications.exists()):
            if self.is_special:
                qs = self.qualifications.values_list('name', flat=True)
            else:
                qs = self.topic.qualifications.values_list('name', flat=True)
            if qs.exists():
                output.write('<div class="additional">')
                output.write(
                    "<p>Für die Teilnahme an diesem Kurs ist die Beherrschung folgender "
                    "Kursinhalte Voraussetzung: {}</p>".format(
                        ', '.join([q for q in qs])
                    )
                )
                output.write('</div>')

        output.write('<p>')
        lines = []
        if self.instruction.distal:
            lines.append('<strong>Abfahrt:</strong> {}'.format(self.instruction.departure()))
        else:
            lines.append('<strong>Termin:</strong> {}'.format(self.instruction.appointment()))
        if self.instruction.source:
            lines.append('<strong>Ausgangspunkt:</strong> {}'.format(self.instruction.source))
        if self.instruction.location and self.instruction.distal:
            lines.append('<strong>{}:</strong> {}'.format("Übernachtung" if self.instruction.end_date else "Ausgangspunkt", self.instruction.location))
        output.write('<br />'.join(lines))
        output.write('</p>')

        if self.meeting_list.exists():
            output.write('<p><strong>Weitere Termine:</strong><br />')
            output.write('<br />'.join([e.appointment() for e in self.meeting_list.all()]))
            output.write('</p>')

        if not self.is_special and self.instruction.description:
            output.write('<div class="additional"><p>{}</p></div>'.format(self.instruction.description))

        output.write('<p>')
        lines = [
            "<strong>Teilnehmerzahl:</strong>{} maximal {} {}Teilnehmer".format(
                " Mindestens {},".format(self.min_quantity) if self.min_quantity else '',
                self.max_quantity, "weibliche " if self.ladies_only else ''
            )
        ]
        if self.advances:
            advances = "<strong>Vorauszahlung:</strong> {} €{}".format(
                int(self.advances), " für {}".format(self.advances_info) if self.advances_info else ''
            )
            lines.append(advances)
        if self.admission > 0:
            lines.append("<strong>Teilnehmergebühr:</strong> {} €".format(int(self.admission)))
        if self.extra_charges:
            extra_charges = "<strong>Zusatzkosten:</strong> {} €{}".format(
                self.extra_charges, " für {}".format(self.extra_charges_info) if self.extra_charges_info else ''
            )
            lines.append(extra_charges)
        if self.instruction.distance:
            travel_cost = "<strong>Fahrtkostenbeteiligung:</strong> ca. {} € für ungefähr {} km".format(
                int(0.07 * float(self.instruction.distance)), self.instruction.distance
            )
            lines.append(travel_cost)
        guides = self.guides()
        if guides:
            lines.append('<strong>Organisation:</strong> {}'.format(guides))
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

        output.write('<p>Es gelten unsere '
                     '<a href="/aktivitaeten/teilnahmebedingungen/" '
                     'title="Teilnahmebedingungen">Teilnahme-</a>'
                     ' und '
                     '<a href="/aktivitaeten/stornobedingungen/" '
                     'title="Stornobedingungen">Stornobedingungen</a>.'
                     '</p>')

        output.write('<p><strong>Hinweis zum Buchungsstand:</strong> Die aktuellen '
                     'Buchungsstände sind in unserem externen Reservierungsportal einsehbar. '
                     'Die Geschäftsstelle gibt euch gerne Auskunft über den aktuellsten Stand.</p>')

        return output.getvalue()

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

        output.write('<p>')
        lines = []
        preliminary = self._preliminary()
        if preliminary[0]:
            lines.append("<strong>{}:</strong> {}".format(*preliminary))
        lines.append('<strong>Abfahrt:</strong> {}'.format(self.tour.departure()))
        if self.tour.source:
            lines.append('<strong>Ausgangspunkt:</strong> {}'.format(self.tour.source))
        if self.tour.location:
            lines.append('<strong>Übernachtung:</strong> {}'.format(self.tour.location))
        output.write('<br />'.join(lines))
        output.write('</p>')

        return output.getvalue()

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Kurs"
        verbose_name_plural = "Kurse"
        ordering = ('instruction__start_date', 'topic__order')