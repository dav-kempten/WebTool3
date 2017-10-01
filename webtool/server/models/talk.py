# -*- coding: utf-8 -*-
from django.db import models

from .event import Event
from .mixins import SeasonMixin, StateMixin, ChapterMixin
from .time_base import TimeMixin
from . import fields


class Talk(SeasonMixin, TimeMixin, StateMixin, ChapterMixin, models.Model):

    talk = models.OneToOneField(
        Event,
        primary_key=True,
        verbose_name='Vortrag',
        related_name='talk',
        on_delete=models.PROTECT,
    )

    speaker = models.CharField(
        verbose_name='Referent',
        max_length=125,
        blank=True, default='',
        help_text="Name des Referenten",

    )

    admission = fields.AdmissionField(
        verbose_name='Beitrag für Mitglieder',
        help_text="Teilnehmerbeitrag in €"
    )

    tariffs = models.ManyToManyField(
        'Tariff',
        db_index=True,
        verbose_name='Preisaufschläge',
        related_name='talk_list',
    )

    def __str__(self):
        return "{}, {} [{}]".format(self.talk.title, self.talk.long_date(with_year=True), self.season.name)

    class Meta:
        verbose_name = "Vortrag"
        verbose_name_plural = "Vortäge"
        ordering = ('talk__start_date', )
