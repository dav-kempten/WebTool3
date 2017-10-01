# -*- coding: utf-8 -*-
from django.db import models

from .mixins import SeasonMixin, PartMixin
from .time_base import TimeMixin
from . import fields


class Section(SeasonMixin, TimeMixin, PartMixin, models.Model):

    # SeasonMixin is needed only for namespace checking. See unique_together.

    name = fields.NameField(
        'Bezeichnung',
        help_text="Bezeichnung des Unterabschnitts",
    )

    description = fields.DescriptionField(
        'Beschreibung',
        help_text="Beschreibung des Unterabschnitts",
        blank=True, default=''
    )

    order = fields.OrderField()

    def __str__(self):
        return "{} - {} [{}]".format(self.name, self.part.name, self.part.season.name)

    class Meta:
        verbose_name = "Unterabschnitt"
        verbose_name_plural = "Unterabschnitte"
        unique_together = ('season', 'part', 'name')
        ordering = ('season__name', 'order', 'name')
