# -*- coding: utf-8 -*-
from django.core.validators import MaxValueValidator
from django.db import models

from .category import Category
from .mixins import SeasonMixin
from .time_base import TimeMixin


class Reference(SeasonMixin, TimeMixin, models.Model):

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

    def __str__(self):
        return "{}-{}{:02d}".format(self.category, self.season.name[-1], self.reference)

    class Meta:
        verbose_name = "Buchungscode"
        verbose_name_plural = "Buchungscodes"
        unique_together = ('season', 'reference', 'category')
        ordering = ('season__name', 'category__order', 'reference')


def get_reference(value):
    try:
        code, reference = value.split('-')
        category = Category.objects.get(code=code)
        season = '201' + reference[0]
    except ValueError:
        raise Reference.DoesNotExist("Reference matching query does not exist.")
    try:
        reference = int(reference[1:])
    except ValueError:
        raise Reference.DoesNotExist("Reference matching query does not exist.")
    if not reference < 0x7fffffffffffffff:
        raise Reference.DoesNotExist("Reference matching query does not exist.")
    return Reference.objects.get(category=category, season__name=season, reference=reference)
