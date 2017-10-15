# -*- coding: utf-8 -*-
from django.db import models
from .mixins import SeasonsMixin
from .time_base import TimeMixin
from . import fields


class ApproximateManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class Approximate(SeasonsMixin, TimeMixin, models.Model):

    objects = ApproximateManager()

    name = fields.TitleField(
        db_index=True,
        unique=True,
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

    def natural_key(self):
        return self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{}".format(self.name)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Ungefährer Zeitpunkt"
        verbose_name_plural = "Ungefähre Zeitpunkte"
        ordering = ('start_time', )
