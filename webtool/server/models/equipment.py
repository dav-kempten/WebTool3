# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import fields


class EquipmentManager(models.Manager):

    def get_by_natural_key(self, season, code):
        return self.get(season__name=season, code=code)


class Equipment(SeasonMixin, TimeMixin, models.Model):

    objects = EquipmentManager()

    code = models.CharField(
        'Kurzzeichen',
        db_index=True,
        max_length=10,
        help_text="Kurzzeichen für die Ausrüstung",
    )

    name = fields.NameField(
        'Bezeichnung',
        help_text="Bezeichnung der Ausrüstung",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung der Ausrüstung",
    )

    default = models.BooleanField(
        'Die initiale Ausrüstung',
        blank=True, default=False
    )

    def natural_key(self):
        return self.season.name, self.code

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} ({}) [{}]".format(self.name, self.code, self.season.name)

    class Meta:
        verbose_name = "Ausrüstung"
        verbose_name_plural = "Ausrüstungen"
        unique_together = (('season', 'code'), ('season', 'name'))
        ordering = ('season__name', 'code')