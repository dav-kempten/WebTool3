# -*- coding: utf-8 -*-
from datetime import datetime

from django.conf import settings
from django.db import models

from . import defaults, fields
from .time_base import TimeMixin


class RetrainingManager(models.Manager):

    def get_by_natural_key(self, user, year, order):
        return self.get(user__username=user, year=year, order=order)


class Retraining(TimeMixin, models.Model):

    objects = RetrainingManager()

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=True,
        related_name='retraining_list',
        on_delete=models.PROTECT
    )

    qualification = models.ForeignKey(
        'UserQualification',
        db_index=True,
        blank=True, null=True,
        related_name='retraining_list',
        verbose_name='Qualifikation',
        help_text="Für fachspezifische Fortbildungen, die dazugehörige Qualifikation",
        on_delete=models.PROTECT,
    )

    year = models.PositiveIntegerField(
        "Jahr",
        db_index=True,
        default=defaults.get_default_year,
        help_text="Das Jahr, in dem die Fortbildung besucht wurde",
    )

    specific = models.BooleanField(
        "Fachspezifisch",
        default=False,
        help_text="Es handelt sich um eine fachspezifische Fortbildung",
    )

    order = fields.OrderField(blank=False)

    description = models.TextField(
        "Beschreibung",
        help_text="Kurze Beschreibung der Fortbildung",
    )

    note = models.TextField(
        "Notizen",
        blank=True, null=True,
        help_text="Raum für interne Notizen",
    )

    def natural_key(self):
        return self.user.get_username(), self.year, self.order

    natural_key.dependencies = ['auth.user']

    def __str__(self):
        return "{}'s Fortbildung {}".format(self.user.get_full_name(), self.year)

    class Meta:
        get_latest_by = "updated"
        ordering = ['year', 'order']
        verbose_name = "Fortbildung"
        verbose_name_plural = "Fortbildungen"
