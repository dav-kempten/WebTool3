# -*- coding: utf-8 -*-
import datetime

from django.db import models
from django.contrib.postgres import fields as postgres
from django.db.models import Q

from .time_base import TimeMixin
from . import defaults


class SeasonManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class Season(TimeMixin, models.Model):

    objects = SeasonManager()

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

    def natural_key(self):
        return self.name,

    def __str__(self):
        return self.name

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Saison"
        verbose_name_plural = "Saisonen"
        ordering = ('name', )

    def get_public_states(self, with_canceled=False, with_historic=False):
        states = self.state_list.filter(public=True)
        if not with_canceled:
            states = states.exclude(canceled=True)
        if not with_historic:
            states = states.exclude(done=True)
        return states

    def get_canceled_state(self):
        return self.state_list.get(canceled=True)

    def get_tours_by_month(self, month, with_canceled=False, with_historic=False, with_deadline=False, with_preliminary=False):
        year = self.name
        dates = Q(
            tour__start_date__year=year,
            tour__start_date__month=month
        )
        if with_deadline:
            dates = dates | Q(
                deadline__start_date__year=year,
                deadline__start_date__month=month,
            )
        if with_preliminary:
            dates = dates | Q(
                preliminary__isnull=False,
                preliminary__start_date__year=year,
                preliminary__start_date__month=month,
            )
        qs = self.tour_list.filter(
            dates,
            state__in=self.get_public_states(with_canceled=with_canceled, with_historic=with_historic),
            deprecated=False,
            tour__internal=False,
        )
        return qs
