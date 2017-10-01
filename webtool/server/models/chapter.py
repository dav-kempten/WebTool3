# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin, SectionMixin
from .time_base import TimeMixin
from . import fields


class Chapter(SeasonMixin, TimeMixin, SectionMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together.

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

    def __str__(self):
        return "{} - {} - {} [{}]".format(
            self.name, self.section.name, self.section.part.name, self.section.part.season.name
        )

    class Meta:
        verbose_name = "Kapitel"
        verbose_name_plural = "Kapitel"
        unique_together = ('season', 'section', 'name')
        ordering = ('season__name', 'order', 'name')
