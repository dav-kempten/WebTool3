# -*- coding: utf-8 -*-
from django.db import models

from .mixins import PartMixin
from .time_base import TimeMixin
from . import fields


class SectionManager(models.Manager):

    def get_by_natural_key(self, part, name):
        return self.get(part__name=part, name=name)


class Section(TimeMixin, PartMixin, models.Model):

    objects = SectionManager()

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

    def natural_key(self):
        return self.part.name, self.name

    natural_key.dependencies = ['server.part']

    def __str__(self):
        return "{} - {}".format(self.name, self.part.name)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Unterabschnitt"
        verbose_name_plural = "Unterabschnitte"
        unique_together = ('part', 'name')
        ordering = ('order', 'name')
