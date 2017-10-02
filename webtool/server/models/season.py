# -*- coding: utf-8 -*-
import datetime

from django.db import models
from django.contrib.postgres import fields as postgres

from .time_base import TimeMixin
from . import defaults


class Season(TimeMixin, models.Model):

    name = models.SlugField(
        'Bezeichnung',
        unique=True,
        max_length=4,
        help_text="Jahreszahl als Bezeichnung z.B. 2017",
    )

    current = models.BooleanField(
        'Die aktuelle Saison',
        blank=True, default=False
    )

    params = postgres.JSONField(
        blank=True, null=True,
        default=defaults.get_default_params,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Saison"
        verbose_name_plural = "Saisonen"
        ordering = ('name', )
