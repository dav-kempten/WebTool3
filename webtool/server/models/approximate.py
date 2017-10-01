# -*- coding: utf-8 -*-
from django.db import models
from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import fields


class Approximate(SeasonMixin, TimeMixin, models.Model):

    name = fields.TitleField(
        db_index=True,
        verbose_name='Kurzbeschreibung',
        help_text="Ungefährer Zeitpunkt",
    )

    description = fields.DescriptionField(
        help_text="Beschreibung des Zeitraums",
    )

    # Proposals
    # 'Morgens': '07:00',
    # 'Vormittags': '09:00',
    # 'Mittags': '12:00',
    # 'Nachmittags': '14:00',
    # 'Abends': '17:00'

    start_time = models.TimeField(
        'Abreisezeit (ungefähr)',
        help_text="Für die Kalkulation benötigte zeitliche Grundlage",
    )

    default = models.BooleanField(
        'Der initiale Zeitraum',
        blank=True, default=False
    )

    def __str__(self):
        return "{} [{}]".format(self.name, self.season.name)

    class Meta:
        verbose_name = "Ungefährer Zeitpunkt"
        verbose_name_plural = "Ungefähre Zeitpunkte"
        unique_together = ('season', 'name')
        ordering = ('season__name', 'start_time')
