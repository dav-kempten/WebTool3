# -*- coding: utf-8 -*-
from django.conf import settings
from django.db import models
from django.contrib.postgres import fields as postgres
from .mixins import SeasonMixin
from .time_base import TimeMixin


class GuideManager(models.Manager):

    def get_by_natural_key(self, season, username):
        return self.get(season__name=season, user__username=username)


class Guide(SeasonMixin, TimeMixin, models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=True,
        verbose_name='Leiter',
        related_name='guide_list',
        on_delete=models.PROTECT,
    )

    # first_name and last_name are independent from their counterparts in the user model!

    first_name = models.CharField(
        'Vorname',
        max_length=30,
        blank=True, default='Unbekannt'
    )

    last_name = models.CharField(
        'Nachname',
        max_length=30,
        blank=True, default=''
    )

    unknown = models.BooleanField(
        'Unbekannt',
        blank=True, default=False,
        help_text='Der unbekannte Guide'
    )

    profile = postgres.JSONField(
        'Steckbrief',
        blank=True, null=True
    )

    # email is independent from its counterpart in the user model!

    email = models.EmailField(
        'eMail',
        blank=True, default=''
    )

    # phone, mobile are independent from its counterpart in the profile model!

    phone = models.CharField(
        'Festnetz',
        max_length=75,
        blank=True, default='',
        help_text='Die Telefonnummer eines Kurs/Touren/Gruppenleiters für Rückfragen'
    )

    mobile = models.CharField(
        'Handy',
        max_length=75,
        blank=True, default='',
        help_text='Die Handynummer eines Kurs/Touren/Gruppenleiters für Rückfragen'
    )

    portrait = models.FileField(
        'Portrait',
        blank=True, default='',
        help_text='Die URL zu einer Datei mit dem Portrait eines Kurs/Touren/Gruppenleiters'
    )

    @property
    def name(self):
        return ' '.join((self.first_name.strip(), self.last_name.strip()))

    def natural_key(self):
        return self.season.name, self.user.get_username()

    natural_key.dependencies = ['auth.user', 'server.season']

    def __str__(self):
        return "{} [{}]".format(self.name, self.season.name)

    class Meta:
        verbose_name = "Touren/Kurs/Gruppenleiter"
        verbose_name_plural = "Touren/Kurs/Gruppenleiter"
        unique_together = ('season', 'user')
        ordering = ('season__name', 'last_name', 'first_name')
