# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin
from .category import Category
from .time_base import TimeMixin
from . import fields

# requirement to the level of technical skill


class SkillManager(models.Manager):

    def get_by_natural_key(self, season, code):
        return self.get(season__name=season, code=code)


class Skill(SeasonMixin, TimeMixin, models.Model):

    objects = SkillManager()

    code = models.CharField(
        'Kurzbeschreibung',
        max_length=3,
        help_text="Technische Anforderungen",
    )

    order = fields.OrderField()

    default = models.BooleanField(
        'Die initialen technische Anforderungen',
        blank=True, default=False
    )

    def natural_key(self):
        return self.season.name, self.code

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} [{}]".format(self.code, self.season.name)

    class Meta:
        verbose_name = "Technische Anforderung"
        verbose_name_plural = "Technische Anforderungen"
        unique_together = ('season', 'code')
        ordering = ('season__name', 'order', 'code')


class SkillDescriptionManager(models.Manager):

    def get_by_natural_key(self, season, fitness, category):
        return self.get(season__name=season, fitness__code=fitness, category__code=category)


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

    def natural_key(self):
        return self.season.name, self.skill.code, self.category.code

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "{} - {} [{}]".format(self.skill.code, self.category.code, self.skill.season)

    class Meta:
        unique_together = ('season', 'skill', 'category')
        verbose_name = "Beschreibung der technischen Anforderung"
        verbose_name_plural = "Beschreibung der technischen Anforderungen"
        ordering = ('season__name', 'skill__code', 'category__order')
