# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin, SectionMixin
from .time_base import TimeMixin
from . import fields


class ChapterManager(models.Manager):

    def get_by_natural_key(self, season, part, section, name):
        return self.get(season__name=season, section__part=part, section__name=section, name=name)


class Chapter(SeasonMixin, TimeMixin, SectionMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together.

    objects = ChapterManager()

    name = fields.NameField(
        'Bezeichnung',
        help_text="Bezeichnung des Kapitels",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Kapitels",
        blank=True, default=''
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.season.name, self.section.part.name, self.section.name, self.name

    natural_key.dependencies = ['server.season', 'server.part', 'server.section']

    def __str__(self):
        return "{} - {} - {} [{}]".format(
            self.name, self.section.name, self.section.part.name, self.section.part.season.name
        )

    class Meta:
        verbose_name = "Kapitel"
        verbose_name_plural = "Kapitel"
        unique_together = ('season', 'section', 'name')
        ordering = ('season__name', 'order', 'name')
