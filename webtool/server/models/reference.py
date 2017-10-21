# -*- coding: utf-8 -*-
from django.core.validators import MaxValueValidator
from django.db import models

from .category import Category
from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import defaults


class ReferenceManager(models.Manager):

    def get_by_natural_key(self, season, category, reference):
        return self.get(season__name=season, category__code=category, reference=reference)


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

    def natural_key(self):
        return self.season.name, self.category.code, self.reference

    natural_key.dependencies = ['server.season', 'server.category']

    def __str__(self):
        return "{}-{}{:02d}".format(self.category.code, self.season.name[-1], self.reference)

    class Meta:
        verbose_name = "Buchungscode"
        verbose_name_plural = "Buchungscodes"
        unique_together = ('season', 'category', 'reference')
        ordering = ('season__name', 'category__order', 'reference')

    @staticmethod
    def get_reference(value, season=None):
        try:
            code, reference = value.split('-')
            category = Category.objects.get(code=code)
            if season is None:
                season = str(defaults.get_default_year())[:3] + reference[0]
        except ValueError:
            raise Reference.DoesNotExist("Reference matching query does not exist.")
        try:
            reference = int(reference[1:])
        except ValueError:
            raise Reference.DoesNotExist("Reference matching query does not exist.")
        if not reference < 0x7fffffffffffffff:
            raise Reference.DoesNotExist("Reference matching query does not exist.")
        return Reference.objects.get(category=category, season__name=season, reference=reference)
