# -*- coding: utf-8 -*-
from django.db import models

from .event import Event
from .guide import Guide
from .mixins import (
    SeasonMixin, SectionMixin, DescriptionMixin, GuidedEventMixin,
    RequirementMixin, EquipmentMixin, StateMixin, ChapterMixin)
from .time_base import TimeMixin
from . import fields


class Collective(SeasonMixin, SectionMixin, TimeMixin, DescriptionMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together

    # noinspection PyUnresolvedReferences
    categories = models.ManyToManyField(
        'Category',
        db_index=True,
        verbose_name='Kategorie',
        related_name='collective_list',
    )

    managers = models.ManyToManyField(
        Guide,
        db_index=True,
        verbose_name='Manager',
        related_name='collectives',
        blank=True,
        help_text="Ansprechpartner für die Gruppe",
    )

    order = fields.OrderField()

    def __str__(self):
        return "{} [{}]".format(self.title, self.season.name)

    class Meta:
        verbose_name = "Gruppe"
        verbose_name_plural = "Gruppen"
        unique_together = ('season', 'title', 'name')
        ordering = ('season__name', 'order', 'name')


class Session(TimeMixin, GuidedEventMixin, RequirementMixin, EquipmentMixin, StateMixin, ChapterMixin, models.Model):

    # check: category.season and self.season belongs to the same season!

    collective = models.ForeignKey(
        Collective,
        db_index=True,
        verbose_name='Gruppe',
        related_name='session_list',
        on_delete=models.PROTECT,
    )

    session = models.OneToOneField(
        Event,
        primary_key=True,
        verbose_name='Veranstaltung',
        related_name='session',
        on_delete=models.PROTECT,
    )

    speaker = models.CharField(
        verbose_name='Referent',
        max_length=125,
        blank=True, default='',
        help_text="Name des Referenten",

    )

    portal = models.URLField(
        'Tourenportal',
        blank=True, default='',
        help_text="Eine URL zum Tourenportal der Alpenvereine",
    )

    @property
    def season(self):
        return self.collective.season

    def __str__(self):
        return '{} - {}, {} [{}]'.format(
            self.session.title, self.collective.title, self.session.long_date(with_year=True), self.season
        )

    class Meta:
        verbose_name = "Gruppentermin"
        verbose_name_plural = "Gruppentermine"
        ordering = ('collective__season__name', 'collective__name', 'session__start_date', )
