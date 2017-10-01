# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .category import Category
from .time_base import TimeMixin

# requirement to the level of technical skill


class Skill(SeasonMixin, TimeMixin, models.Model):

    code = models.CharField(
        'Kurzbeschreibung',
        max_length=3,
        help_text="Technische Anforderungen",
    )

    default = models.BooleanField(
        'Die initialen technische Anforderungen',
        blank=True, default=False
    )

    def __str__(self):
        return "{} [{}]".format(self.code, self.season.name)

    class Meta:
        verbose_name = "Technische Anforderung"
        verbose_name_plural = "Technische Anforderungen"
        unique_together = ('season', 'code')
        ordering = ('season__name', 'code')


class SkillDescription(SeasonMixin, TimeMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together
    # check skill and category belongs to the same season

    skill = models.ForeignKey(
        Skill,
        db_index=True,
        verbose_name='Technische Anforderung',
        related_name='description_list',
        on_delete=models.PROTECT,
    )

    category = models.ForeignKey(
        Category,
        db_index=True,
        verbose_name='Kategorie',
        related_name='skill_list',
        on_delete=models.PROTECT,
    )

    description = models.TextField(
        'Beschreibung',
        help_text="Beschreibung der technischen Anforderungen",
    )

    def __str__(self):
        return "{} - {} [{}]".format(self.skill.code, self.category.code, self.skill.season)

    class Meta:
        unique_together = ('season', 'skill', 'category')
        verbose_name = "Beschreibung der technischen Anforderung"
        verbose_name_plural = "Beschreibung der technischen Anforderungen"
        ordering = ('season__name', 'skill__code', 'category__order')
