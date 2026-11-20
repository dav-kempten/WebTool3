# -*- coding: utf-8 -*-
import io
from django.db import models

from . import fields, homepage
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

    # Optional extra course category, shown next to the topic's own category.
    # Several courses may share one, hence a ForeignKey (formerly OneToOne, see
    # migration 0051). No index: production never had one on this column.
    category = models.ForeignKey(
        'Category',
        verbose_name='Zusatzkategorie',
        related_name='+',
        db_index=False,
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
        """
        Der Text des Kurses für die Homepage: Titel, Beschreibung, Voraussetzungen,
        Haupttermin mit Treffpunkt, Kursort und Übernachtung in eigenen Zeilen,
        weitere Termine mit denselben Angaben im Fließtext, Teilnehmerzahl,
        Kosten, Organisation, Hinweis, Bedingungen und Fragen.
        """
        output = io.StringIO()

        output.write('<h3>{}</h3>'.format(homepage.text(self.instruction.name if self.is_special else self.topic.name)))
        output.write('<p>{}</p>'.format(homepage.rich(self.instruction.description if self.is_special else self.topic.description)))

        qualifications = (self.qualifications if self.is_special else self.topic.qualifications).values_list('name', flat=True)
        if qualifications.exists():
            output.write(homepage.qualifications(qualifications, 'diesem Kurs'))

        # Haupttermin: Treffpunkt, Kursort und Übernachtung stehen
        # jeweils in einer eigenen, beschrifteten Zeile unter dem Termin.
        if self.instruction.distal:
            lines = [homepage.line('Abfahrt', homepage.text(self.instruction.departure(with_places=False)))]
        else:
            lines = [homepage.line('Termin', homepage.text(self.instruction.appointment(with_places=False)))]
        lines += [homepage.line(label, homepage.text(value)) for label, value in self.instruction.places()]
        output.write(homepage.paragraph(lines))

        # Weitere Termine: dieselben Angaben, beschriftet im Fließtext.
        if self.meeting_list.exists():
            output.write('<p><strong>Weitere Termine:</strong><br />')
            output.write('<br />'.join([homepage.text(e.homepage_appointment()) for e in self.meeting_list.all()]))
            output.write('<br /><br />')
            output.write('<strong>Obacht!</strong> Alle Theorieteile sind verpflichtend und Voraussetzung für die '
                         'Teilnahme an den Praxisterminen. Die Theorieteile müssen in Präsenz wahrgenommen werden, '
                         'sofern nichts anderes in der Beschreibung steht.')
            output.write('</p>')

        if not self.is_special and self.instruction.description:
            output.write('<div class="additional"><p>{}</p></div>'.format(homepage.rich(self.instruction.description)))

        lines = [
            "<strong>Teilnehmerzahl:</strong>{} maximal {} {}Teilnehmer".format(
                " Mindestens {},".format(self.min_quantity) if self.min_quantity else '',
                self.max_quantity, "weibliche " if self.ladies_only else ''
            )
        ]
        lines += homepage.costs(self, self.instruction, always_admission=False)
        guides = self.guides()
        if guides:
            lines.append(homepage.line('Organisation', homepage.text(guides)))
        output.write(homepage.paragraph(lines))

        output.write(self.remark())
        output.write(homepage.CONDITIONS)
        output.write(homepage.QUESTIONS)

        return output.getvalue()

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Kurs"
        verbose_name_plural = "Kurse"
        ordering = ('instruction__start_date', 'topic__order')