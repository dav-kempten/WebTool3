# -*- coding: utf-8 -*-
from django.db import models

from .event import Event
from .mixins import SeasonMixin, StateMixin, ChapterMixin
from .time_base import TimeMixin
from . import fields


class TalkManager(models.Manager):

    def get_by_natural_key(self, season, reference):
        talk = Event.objects.get_by_natural_key(season, reference)
        return talk.talk


class Talk(SeasonMixin, TimeMixin, StateMixin, ChapterMixin, models.Model):

    objects = TalkManager()

    talk = models.OneToOneField(
        Event,
        primary_key=True,
        verbose_name='Vortrag',
        related_name='talk',
        on_delete=models.PROTECT,
    )

    speaker = models.CharField(
        verbose_name='Referent',
        max_length=125,
        blank=True, default='',
        help_text="Name des Referenten",

    )

    admission = fields.AdmissionField(
        verbose_name='Beitrag für Mitglieder',
        help_text="Teilnehmerbeitrag in €"
    )

    min_quantity = models.PositiveIntegerField(
        'Min. Tln',
        blank=True, default=0,
        help_text="Wieviel Teilnehemr müssen mindestens teilnehmen",
    )

    max_quantity = models.PositiveIntegerField(
        'Max. Tln',
        help_text="Wieviel Teilnehemr können maximal teilnehmen",
    )

    cur_quantity = models.PositiveIntegerField(
        'Anmeldungen',
        blank=True, default=0,
        help_text="Wieviel Teilnehemr sind aktuell angemeldet",
    )

    tariffs = models.ManyToManyField(
        'Tariff',
        db_index=True,
        verbose_name='Preisaufschläge',
        related_name='talk_list',
    )

    def natural_key(self):
        return self.season.name, str(self.talk.reference)

    natural_key.dependencies = ['server.season', 'server.event']

    def __str__(self):
        return "{}, {} [{}]".format(self.talk.title, self.talk.long_date(with_year=True), self.season.name)

    def subject(self):
        return ""

    def details(self):
        return ""

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Vortrag"
        verbose_name_plural = "Vortäge"
        ordering = ('talk__start_date', )
