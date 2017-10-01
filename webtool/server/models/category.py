# -*- coding: utf-8 -*-
from django.db import models

from . import fields
from .mixins import SeasonMixin
from .time_base import TimeMixin


class Category(SeasonMixin, TimeMixin, models.Model):

    code = models.CharField(
        'Kurzzeichen',
        max_length=3,
        db_index=True,
        help_text="Kurzzeichen der Kategorie",
    )

    name = fields.NameField(
        help_text="Bezeichnung der Kategorie",
    )

    order = fields.OrderField()

    tour = models.BooleanField(
        'Touren',
        db_index=True,
        blank=True, default=False,
        help_text = 'Kategorie für Touren'
    )

    talk = models.BooleanField(
        'Vorträge',
        db_index=True,
        blank=True, default=False,
        help_text = 'Kategorie für Vorträge'
    )

    topic = models.BooleanField(
        'Kurse',
        db_index=True,
        blank=True, default=False,
        help_text = 'Kategorie für Kurse'
    )

    # Check: A collective will define its own set of categories

    collective = models.BooleanField(
        'Gruppentermine',
        db_index=True,
        blank=True, default=False,
        help_text = 'Kategorie für Gruppentermine'
    )

    winter = models.BooleanField(
        'Wintersportart',
        db_index=True,
        blank=True, default=False
    )

    summer = models.BooleanField(
        'Sommersportart',
        db_index=True,
        blank=True, default=False
    )

    climbing = models.BooleanField(
        'Klettersportart',
        blank=True, default=False
    )

    def __str__(self):
        return "{} ({}) [{}]".format(self.name, self.code, self.season.name)

    class Meta:
        verbose_name = "Kategorie"
        verbose_name_plural = "Kategorien"
        unique_together = (('season', 'code'), ('season', 'code', 'name'))
        ordering = ('season__name', 'order', 'code', 'name')
