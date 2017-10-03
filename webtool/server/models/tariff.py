# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import fields


class TariffManager(models.Manager):

    def get_by_natural_key(self, season, name):
        return self.get(season__name=season, name=name)


class Tariff(SeasonMixin, TimeMixin, models.Model):

    objects = TariffManager()

    name = fields.NameField(
        'Bezeichnung',
        help_text="Bezeichnung der Preisgruppe",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Preisgruppe",
        blank=True, default=''
    )

    order = fields.OrderField()

    multiplier = models.DecimalField(
        'Preisaufschlag',
        max_digits=6, decimal_places=3,
        blank=True, default=0.0,
        help_text='Preisaufschlag auf Mitgliederpreise'
    )

    def natural_key(self):
        return self.season.name, self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} [{}]".format(self.name, self.season.name)

    class Meta:
        verbose_name = "Preisgruppe"
        verbose_name_plural = "Preisgruppen"
        unique_together = ('season', 'name')
        ordering = ('season__name', 'order', 'name')
