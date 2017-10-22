# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonsMixin
from .category import Category
from .time_base import TimeMixin
from . import fields

# requirement to the level of technical skill


class SkillManager(models.Manager):

    def get_by_natural_key(self, code):
        return self.get(code=code)


class Skill(SeasonsMixin, TimeMixin, models.Model):

    objects = SkillManager()

    code = models.CharField(
        'Kurzbeschreibung',
        unique=True,
        max_length=3,
        help_text="Technische Anforderungen",
    )

    order = fields.OrderField()

    default = models.BooleanField(
        'Die initialen technische Anforderungen',
        blank=True, default=False
    )

    def natural_key(self):
        return self.code,

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return self.code

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Technische Anforderung"
        verbose_name_plural = "Technische Anforderungen"
        ordering = ('order', 'code')


class SkillDescriptionManager(models.Manager):

    def get_by_natural_key(self, fitness, category):
        return self.get(fitness__code=fitness, category__code=category)


class SkillDescription(TimeMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together
    # check skill and category belongs to the same season

    objects = SkillDescriptionManager()

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
        return self.skill.code, self.category.code

    natural_key.dependencies = ['server.category']

    def __str__(self):
        return "{} - {}".format(self.skill.code, self.category.code)

    class Meta:
        get_latest_by = "updated"
        unique_together = ('skill', 'category')
        verbose_name = "Beschreibung der technischen Anforderung"
        verbose_name_plural = "Beschreibung der technischen Anforderungen"
        ordering = ('skill__code', 'category__order')
