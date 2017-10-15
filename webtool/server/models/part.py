# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonsMixin
from .time_base import TimeMixin
from . import fields


class PartManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class Part(SeasonsMixin, TimeMixin, models.Model):

    objects = PartManager()

    name = fields.NameField(
        'Bezeichnung',
        unique=True,
        help_text="Bezeichnung des Abschnitts",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Abschnitts",
        blank=True, default=''
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.name

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{}".format(self.name)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Abschnitt"
        verbose_name_plural = "Abschnitte"
        ordering = ('order', 'name')
