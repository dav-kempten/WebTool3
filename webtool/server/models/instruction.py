# -*- coding: utf-8 -*-
from django.db import models

from . import fields
from .event import Event
from .mixins import DescriptionMixin, QualificationMixin, ChapterMixin, SeasonsMixin
from .mixins import EquipmentMixin, GuidedEventMixin, AdminMixin, AdmissionMixin

from .time_base import TimeMixin


class TopicManager(models.Manager):

    def get_by_natural_key(self, title, internal):
        return self.get(title=title, internal=internal)


class Topic(SeasonsMixin, TimeMixin, DescriptionMixin, QualificationMixin, EquipmentMixin, models.Model):

    objects = TopicManager()

    # noinspection PyUnresolvedReferences
    category = models.ForeignKey(
        'Category',
        db_index=True,
        verbose_name='Kategorie',
        related_name='topic_list',
        on_delete=models.PROTECT,
    )

    tariffs = models.ManyToManyField(
        'Tariff',
        db_index=True,
        verbose_name='Preisaufschläge',
        related_name='instruction_list',
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.title, self.internal

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{}{}".format(self.title, " internal" if self.internal else "")

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Kursinhalt"
        verbose_name_plural = "Kursinhalte"
        unique_together = ('title', 'internal')
        ordering = ('seasons__name', 'order', 'name')


class InstructionManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        instruction = Event.objects.get_by_natural_key(season, reference)
        return instruction.instruction


class Instruction(TimeMixin, GuidedEventMixin, AdminMixin, AdmissionMixin, ChapterMixin, models.Model):

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
        default=False,
    )

    @property
    def season(self):
        return self.instruction.season

    def natural_key(self):
        return self.instruction.season, str(self.instruction.reference)

    natural_key.dependencies = ['server.season', 'server.event', 'server.topic']

    def __str__(self):
        return "{}{}, {} [{}]".format(
            self.topic.title,
            " ({})".format(self.instruction.name) if self.instruction.name else '',
            self.instruction.long_date(with_year=True),
            self.season
        )

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Kurs"
        verbose_name_plural = "Kurse"
        ordering = ('instruction__start_date', 'topic__order')