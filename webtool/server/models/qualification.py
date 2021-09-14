# -*- coding: utf-8 -*-
from django.conf import settings
from django.db import models

from .time_base import TimeMixin
from . import fields, defaults


class QualificationGroupManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class QualificationGroup(TimeMixin, models.Model):

    objects = QualificationGroupManager()

    name = fields.NameField(
        help_text="Bezeichnung der Qualifikationsgruppe",
        unique=True
    )

    long_rate = fields.AdmissionField(
        verbose_name="Abrechnungssatz für lange Kurstage",
        help_text="Abrechnungssatz für Kurstage länger als 6 Stunden in €"
    )

    middle_rate = fields.AdmissionField(
        verbose_name="Abrechnungssatz für mittlere Kurstage",
        help_text="Abrechnungssatz für Kurstage länger als 3 Stunden und kürzer als 6 Stunden in €"
    )

    short_rate = fields.AdmissionField(
        verbose_name="Abrechnungssatz für kurze Kurstage",
        help_text="Abrechnungssatz für Kurstage kürzer als 3 Stunden in €"
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.name,

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Qualifikationsgruppe"
        verbose_name_plural = "Qualifikationsgruppen"
        ordering = ('order', 'name')


class QualificationManager(models.Manager):

    def get_by_natural_key(self, code):
        return self.get(code=code)


class Qualification(TimeMixin, models.Model):

    objects = QualificationManager()

    code = models.CharField(
        'Kurzzeichen',
        primary_key=True,
        max_length=10,
        help_text="Kurzzeichen der Qualifikation",
    )

    name = fields.NameField(
        help_text="Bezeichnung der Qualifikation",
    )

    order = fields.OrderField()

    group = models.ForeignKey(
        'QualificationGroup',
        db_index=True,
        related_name='qualifications',
        on_delete=models.PROTECT,
        blank=True, null=True
    )

    def natural_key(self):
        return self.code,

    def __str__(self):
        return "{} ({})".format(self.name, self.code)

    class Meta:
        verbose_name = "Qualifikation"
        verbose_name_plural = "Qualifikationen"
        unique_together = (('code', 'name'), ('code', 'group'))
        ordering = ('order', 'code', 'name')


class UserQualificationManager(models.Manager):

    def get_by_natural_key(self, username, qualification, year):
        return self.get(user__username=username, qualification__code=qualification, year=year)


class UserQualification(TimeMixin, models.Model):

    objects = UserQualificationManager()

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=True,
        related_name='qualification_list',
        on_delete=models.PROTECT
    )

    qualification = models.ForeignKey(
        'Qualification',
        db_index=True,
        related_name='user_list',
        on_delete=models.PROTECT
    )

    aspirant = models.BooleanField(
        "Anwärter",
        default=False,
        help_text="Die Qualifikation wurde noch nicht erworben",
    )

    year = models.PositiveSmallIntegerField(
        "Jahr",
        default=defaults.get_default_year,
        help_text="Das Jahr, in dem die Ausbildung abgeschlossen wurde",
    )

    inactive = models.BooleanField(
        "Keine Fortbildung notwendig",
        default=False,
    )

    note = models.TextField(
        "Notizen",
        blank=True, default='',
        help_text="Raum für interne Notizen",
    )

    def natural_key(self):
        return self.user.get_username(), self.qualification.code, self.year

    def code(self):
        return self.qualification.code

    natural_key.dependencies = ['auth.user', 'server.qualification']

    def __str__(self):
        return "{} von {}".format(self.qualification.name, self.year)

    class Meta:
        verbose_name = "Trainer-Qualifikation"
        verbose_name_plural = "Trainer-Qualifikationen"
        get_latest_by = "updated"
        unique_together = ('user', 'qualification', 'year')
        ordering = ('year', 'qualification__order')
