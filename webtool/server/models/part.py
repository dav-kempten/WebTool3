# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import fields


class PartManager(models.Manager):

    def get_by_natural_key(self, season, name):
        return self.get(season__name=season, name=name)


class Part(SeasonMixin, TimeMixin, models.Model):

    objects = PartManager()

    name = fields.NameField(
        'Bezeichnung',
        help_text="Bezeichnung des Abschnitts",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Abschnitts",
        blank=True, default=''
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.season.name, self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} [{}]".format(self.name, self.season.name)

    class Meta:
        verbose_name = "Abschnitt"
        verbose_name_plural = "Abschnitte"
        unique_together = ('season', 'name')
        ordering = ('season__name', 'order', 'name')
