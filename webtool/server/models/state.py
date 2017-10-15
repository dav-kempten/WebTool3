# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonsMixin
from .time_base import TimeMixin
from . import fields, Season


class StateManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class State(SeasonsMixin, TimeMixin, models.Model):

    objects = StateManager()

    name = fields.TitleField(
        'Kurzbeschreibung',
        unique=True,
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
        return self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{}".format(self.name)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Bearbeitungsstand"
        verbose_name_plural = "Bearbeitungsstände"
        ordering = ('order', 'name')
