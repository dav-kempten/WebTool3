# -*- coding: utf-8 -*-
import re

from django.core.validators import MaxValueValidator
from django.db import models

from server.models import Season
from .category import Category
from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import defaults


class ReferenceManager(models.Manager):

    def get_by_natural_key(self, season, category, prefix, reference):
        return self.get(season__name=season, category__code=category, prefix=prefix, reference=reference)


class Reference(SeasonMixin, TimeMixin, models.Model):

    objects = ReferenceManager()

    # noinspection PyUnresolvedReferences
    category = models.ForeignKey(
        'Category',
        db_index=True,
        verbose_name='Kategorie',
        related_name='event_list',
        on_delete=models.PROTECT,
    )

    reference = models.PositiveSmallIntegerField(
        verbose_name='Buchungscode',
        validators=[MaxValueValidator(99, 'Bitte keine Zahlen größer 99 eingeben')]
    )

    prefix = models.PositiveSmallIntegerField(
        verbose_name='Jahreszahl',
        validators=[MaxValueValidator(9, 'Bitte keine Zahlen größer 9 eingeben')],
        blank=True, default=defaults.get_default_prefix
    )

    def natural_key(self):
        return self.season.name, self.category.code, self.prefix, self.reference

    natural_key.dependencies = ['server.season', 'server.category']

    def __str__(self):
        return "{}-{}{:02d}".format(self.category.code, self.prefix, self.reference)

    class Meta:
        verbose_name = "Buchungscode"
        verbose_name_plural = "Buchungscodes"
        unique_together = ('season', 'category', 'prefix', 'reference')
        ordering = ('season__name', 'category__order', 'prefix', 'reference')

    @staticmethod
    def get_reference(value, season=None):

        try:
            code, prefix, reference = [int(x) if x.isnumeric() else x for x in re.split(r'-(\d)(\d{2})', value)[:3]]
        except ValueError:
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        try:
            category = Category.objects.get(code=code)
        except Category.DoesNotExist:
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        if isinstance(season, str):
            try:
                season = Season.objects.get(name=season)
            except Season.DoesNotExist:
                raise Reference.DoesNotExist("Reference matching query does not exist.")

        if season is None:
            try:
                season = Season.objects.get(name__endswith=str(prefix))
            except Season.DoesNotExist:
                season = Season.objects.get(current=True)

        return Reference.objects.get(season=season, category=category, prefix=prefix, reference=reference)
