# -*- coding: utf-8 -*-
import datetime

from django.db import models
from django.contrib.postgres import fields as postgres

from .time_base import TimeMixin


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
        default=dict(
            travel_cost_factor=0.07,
            accommodation_cost_default=40.00,
            youth_part_id=0,
            climbing_shool_part_id=0,
            tour_calulation=dict(
                whole_tour_day_compensation=30.00,
                half_tour_day_compensation=20.00,
                min_admission=5.00
            ),
            talk_categories='tlk',
        )
    )  # JSON data as base for e.g. calculation of budget

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Saison"
        verbose_name_plural = "Saisonen"
        ordering = ('name', )
