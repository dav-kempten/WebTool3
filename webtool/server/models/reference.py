# -*- coding: utf-8 -*-
import re

from django.core.validators import MaxValueValidator
from django.db import models

from server.models import Season
from .category import Category
from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import defaults

REFERENCE_RANGE = set(range(1, 100))


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
            code, prefix, reference = [
                int(x) if x.isnumeric() else x for x in re.split(r'-(\d)(\d{2})', value)[:3]
            ]
        except ValueError:
            # noinspection PyCallByClass
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        if isinstance(season, str):
            try:
                season = Season.objects.get(name=season)
            except Season.DoesNotExist:
                # noinspection PyCallByClass
                raise Reference.DoesNotExist("Reference matching query does not exist.")

        if season is None:
            season = Season.objects.get(current=True)

        try:
            category = Category.objects.get(seasons=season, code=code)
        except Category.DoesNotExist:
            # noinspection PyCallByClass
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        return Reference.objects.get(season=season, category=category, prefix=prefix, reference=reference)

    @staticmethod
    def create_reference(category=None, prefix=None, season=None, **kwargs):

        reference = None
        if isinstance(season, str):
            try:
                season = Season.objects.get(name=season)
            except Season.DoesNotExist as exception:
                print('Season "{}" nicht gefunden'.format(season))
                raise exception

        if season is None:
            season = defaults.get_default_season()

        if isinstance(category, str):
            try:
                category = Category.objects.get(code=category, seasons=season, **kwargs)
            except Category.DoesNotExist as exception:
                print('Category "{}" nicht gefunden'.format(category))
                raise exception

        if category is None:
            category = Category.objects.filter(seasons=season, **kwargs).order_by('code').last()
            if category is None:
                print('Category "{}" nicht gefunden'.format(repr(kwargs)))
                # noinspection PyCallByClass
                raise Category.DoesNotExist("Reference matching query does not exist.")

        if prefix is None:
            prefix = int(season.name[-1])

        reference = find_free_references(category=category, prefix=prefix, season=season)

        if reference is None:
            category_code = category.code
            category_index = category_code[-1]
            if category_index < "0" or category_index > "9":
                print('Category "{}" hat keinen Zähler'.format(category_code))
                # noinspection PyCallByClass
                raise Category.DoesNotExist("Reference matching query does not exist.")
            category.pk = None
            category_index = int(category_index) + 1
            category.code = "{}{:1d}".format(category_code[:2], category_index)
            category.save()
            category.seasons.add(season)
            reference = Reference.create_reference(category=category, prefix=prefix, season=season, **kwargs)
        return reference


def find_free_references(category=None, prefix=None, season=None):
    prefix_idx = int(prefix)
    free_references = set()
    reference = None

    while True:
        cur_references = set(
            Reference.objects.filter(category=category, prefix=prefix_idx, season=season).values_list(
                'reference',flat=True)
        )

        free_references = REFERENCE_RANGE - cur_references

        if free_references:
            break

        # Maintain prefixes between 0 and 9
        prefix_idx = (prefix_idx + 1) % 10

        if int(prefix) == prefix_idx:
            reference = None
            break

    if free_references:
        reference = Reference.objects.create(
            season=season, category=category, prefix=prefix_idx, reference=min(free_references)
        )

    return reference
