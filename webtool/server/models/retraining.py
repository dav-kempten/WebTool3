# -*- coding: utf-8 -*-
from datetime import datetime

from django.db import models

from . import defaults
from .time_base import TimeMixin


class Retraining(TimeMixin, models.Model):

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

    description = models.TextField(
        "Beschreibung",
        help_text="Kurze Beschreibung der Fortbildung",
    )

    note = models.TextField(
        "Notizen",
        blank=True, null=True,
        help_text="Raum für interne Notizen",
    )

    def user(self):
        return self.qualification.user

    def __str__(self):
        return "{}'s Fortbildung {}".format(self.user.full_name, self.year)

    class Meta:
        ordering = ['year', 'qualification__qualification__order']
        verbose_name = "Fortbildung"
        verbose_name_plural = "Fortbildungen"
