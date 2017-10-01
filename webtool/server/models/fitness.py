# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .category import Category
from .time_base import TimeMixin

# requirements to the level of physical fitness


class Fitness(SeasonMixin, TimeMixin, models.Model):

    code = models.CharField(
        'Kurzbeschreibung',
        db_index=True,
        max_length=3,
        help_text="Konditionelle Anforderungen",
    )

    default = models.BooleanField(
        'Die initiale konditionelle Anforderung',
        blank=True, default=False
    )

    def __str__(self):
        return "{} [{}]".format(self.code, self.season.name)

    class Meta:
        verbose_name = "Konditionelle Anforderung"
        verbose_name_plural = "Konditionelle Anforderungen"
        unique_together = ('season', 'code')
        ordering = ('code', )


class FitnessDescription(SeasonMixin, TimeMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together
    # check: fitness and category belongs to the same season!

    fitness = models.ForeignKey(
        Fitness,
        db_index=True,
        verbose_name='Konditionelle Anforderung',
        related_name='description_list',
        on_delete=models.PROTECT,
    )

    category = models.ForeignKey(
        Category,
        db_index=True,
        verbose_name='Kategorie',
        related_name='fitness_list',
        on_delete=models.PROTECT,
    )

    description = models.TextField(
        'Beschreibung',
        help_text="Beschreibung der Konditionelle Anforderung",
    )

    def __str__(self):
        return "{} - {} [{}]".format(self.fitness.code, self.category.code, self.fitness.season)

    class Meta:
        unique_together = ('season', 'fitness', 'category')
        verbose_name = "Beschreibung der Konditionelle Anforderung"
        verbose_name_plural = "Beschreibungen der Konditionelle Anforderungen"
        ordering = ('season__name', 'fitness__code', 'category__order')
