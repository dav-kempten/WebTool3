# -*- coding: utf-8 -*-
import re
from datetime import datetime

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from .time_base import TimeMixin

MEMBER_ID_REGEX = re.compile(r'\d{3}-\d{2}-\d{6}', re.UNICODE)

SEX_CHOICES = (
    (0, 'unbekannt'),
    (1, 'männlich'),
    (2, 'weiblich'),
    (9, 'nicht anwendbar')
)


class Profile(TimeMixin, models.Model):

    # This is the key for data exchange with KV-Manager
    # Authenticates an guide for proposals

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        primary_key=True,
        verbose_name='user',
        related_name='profile',
        on_delete=models.PROTECT
    )

    member_id = models.CharField(
        'MitgliedsNr',
        max_length=13,
        blank=True, null=True, unique=True,
        help_text="Format:sss-oo-mmmmmm s=Sektionsnummer(008) o=Ortsgruppe(00|01) m=Mitgliedsnummer",
        validators=[RegexValidator(MEMBER_ID_REGEX, 'Bitte auf den richtigen Aufbau achten')],
    )

    sex = models.PositiveSmallIntegerField(
        "Geschlecht",
        choices=SEX_CHOICES,
        blank=True, default=0,
        help_text="Biologisches Geschlecht"
    )

    phone = models.CharField(
        "Telefon",
        max_length=75,
        blank=True, default='',
        help_text="Rufnummer für Nachfragen in Sektionsangelegenheiten",
    )

    mobile = models.CharField(
        "Handy",
        max_length=75,
        blank=True, default='',
        help_text="Rufnummer für die Erreichbarkeit auf Tour",
    )

    birth_date = models.DateField(
        "Geburtstag",
        blank=True, null=True
    )

    note = models.TextField(
        "Notizen",
        blank=True, default='',
        help_text="Raum für interne Notizen",
    )

    member_year = models.PositiveIntegerField(
        "Jahr",
        default=datetime.now().year,
        blank=True, null=True,
        help_text="Jahr der Aufnahme in den AV",
    )

    integral_member = models.BooleanField(
        "A-Mitglied",
        blank=True, default=False
    )

    # member_home is valid only if integral_member is False
    # integral_member = False => Retrainings are not possible

    member_home = models.CharField(
        "Heimatsektion",
        max_length=70,
        blank=True, default='',
        help_text="Heimatsektion für C-Mitglieder"
    )

    def __str__(self):
        return "{}'s Steckbrief".format(self.user.username)

    class Meta:
        verbose_name = "Steckbrief"
        verbose_name_plural = "Steckbriefe"
        ordering = ('user__last_name', 'user__first_name')
