# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import fields, Season


class StateManager(models.Manager):

    def get_by_natural_key(self, season, name):
        return self.get(season__name=season, name=name)


class State(SeasonMixin, TimeMixin, models.Model):

    objects = StateManager()

    name = fields.TitleField(
        'Kurzbeschreibung',
        help_text="Bearbeitungsstand",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Bearbeitungsstandes",
    )

    order = fields.OrderField()

    public = models.BooleanField(
        'Alle öffentlichen sichtbaren Bearbeitungsstände',
        blank=True, default=False
    )

    default = models.BooleanField(
        'Der Bearbeitungsstand: "In Arbeit"',
        blank=True, default=False
    )

    canceled = models.BooleanField(
        'Der Bearbeitungsstand: "Ausgefallen"',
        blank=True, default=False
    )

    moved = models.BooleanField(
        'Der Bearbeitungsstand: "Verschoben"',
        blank=True, default=False
    )

    unfeasible = models.BooleanField(
        'Der Bearbeitungsstand: "Noch nicht buchbar"',
        blank=True, default=False
    )

    done = models.BooleanField(
        'Der Bearbeitungsstand: "Durchgeführt"',
        blank=True, default=False
    )

    def natural_key(self):
        return self.season.name, self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} [{}]".format(self.name, self.season.name)

    class Meta:
        verbose_name = "Bearbeitungsstand"
        verbose_name_plural = "Bearbeitungsstände"
        unique_together = ('season', 'name')
        ordering = ('season__name', 'order', 'name')
