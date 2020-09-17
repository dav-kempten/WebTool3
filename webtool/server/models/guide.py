# -*- coding: utf-8 -*-
from django.conf import settings
from django.db import models
from django.contrib.postgres import fields as postgres

from .mixins import SeasonsMixin
from .time_base import TimeMixin


class GuideManager(models.Manager):

    def get_by_natural_key(self, username):
        return self.get(user__username=username)


class Guide(SeasonsMixin, TimeMixin, models.Model):

    objects = GuideManager()

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        primary_key=True,
        verbose_name='Leiter',
        related_name='guide',
        on_delete=models.PROTECT,
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
        return self.user.get_full_name()

    def natural_key(self):
        return self.user.get_username(),

    natural_key.dependencies = ['auth.user', 'server.season']

    def __str__(self):
        return self.name

    def qualification_list(self):
        qualification_list = (
            self.user.qualification_list.exclude(
                qualification__name__in=["Anwärter", "Kletterassistent (Kempten)"]
            ).values_list('qualification__name',flat=True)
        )
        qualification = ', '.join(qualification_list)
        return (
            qualification.replace('Fachübungsleiter', 'FÜL')
                .replace('Zusatzqualifikation', 'ZQ')
                .replace('Trainer ', 'T')
                .replace('JDAV-', '')
        ) if qualification else None

    def retraining_list(self):
        retraining_list = (self.user.retraining_list.values_list('description', flat=True))
        retraining = ', '.join(filter(None, retraining_list))
        return retraining

    class Meta():
        get_latest_by = "updated"
        verbose_name = "Touren/Kurs/Gruppenleiter"
        verbose_name_plural = "Touren/Kurs/Gruppenleiter"
        ordering = ('user__last_name', 'user__first_name')
