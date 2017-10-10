# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonsMixin
from . import fields
from .time_base import TimeMixin


class CategoryManager(models.Manager):

    def get_by_natural_key(self, code):
        return self.get(code=code)


class Category(SeasonsMixin, TimeMixin, models.Model):

    objects = CategoryManager()

    code = models.CharField(
        'Kurzzeichen',
        max_length=3,
        unique=True,
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

    def natural_key(self):
        return self.code

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} ({})".format(self.name, self.code)

    class Meta:
        verbose_name = "Kategorie"
        verbose_name_plural = "Kategorien"
        unique_together = ('code', 'name')
        ordering = ('order', 'code', 'name')
