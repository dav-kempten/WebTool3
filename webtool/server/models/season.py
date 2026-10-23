# -*- coding: utf-8 -*-
import datetime

from django.apps import apps
from django.db import models, transaction
from django.db.models import Q

from .time_base import TimeMixin
from . import defaults

# Every model with a `seasons` ManyToMany (SeasonsMixin). A new season takes over
# their links from the previous one -- see Season.for_year. Names, not classes:
# this module is imported before those models exist.
SEASON_LINKED_MODELS = (
    'Approximate', 'Category', 'CategoryGroup', 'Collective', 'Equipment', 'Fitness',
    'Guide', 'Part', 'Skill', 'State', 'Topic',
)


class SeasonManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class Season(TimeMixin, models.Model):

    objects = SeasonManager()

    name = models.SlugField(
        'Bezeichnung',
        unique=True,
        max_length=4,
        help_text="Jahreszahl als Bezeichnung z.B. 2017",
    )

    current = models.BooleanField(
        'Die aktuelle Saison',
        blank=True, default=False
    )

    params = models.JSONField(
        blank=True, null=True,
        default=defaults.get_default_params,
    )

    def natural_key(self):
        return self.name,

    def __str__(self):
        return self.name

    @classmethod
    def for_year(cls, year):
        """The season of `year`, created on first use. Never changes `current`.

        A new season takes over from the newest season before it (or, if there
        is none, the newest at all): its params, the links of every model in
        SEASON_LINKED_MODELS -- so whatever was unlinked there stays out, nothing
        deleted is revived -- and its tariffs. It gets its own calendar with the
        anniversaries of the newest existing calendar; vacations are specific to
        a year and are not copied.
        """
        name = str(year)
        season = cls.objects.filter(name=name).first()
        if season:
            return season

        with transaction.atomic():
            source = (
                cls.objects.filter(name__lt=name).order_by('-name').first()
                or cls.objects.order_by('-name').first()
            )
            season = cls.objects.create(
                name=name, current=False,
                params=source.params if source else defaults.get_default_params(),
            )

            Calendar = apps.get_model('server', 'Calendar')
            calendar = Calendar.objects.create(season=season)
            latest_calendar = (
                Calendar.objects.exclude(season=season).order_by('-season__name').first()
            )
            if latest_calendar:
                calendar.anniversary_list.add(*latest_calendar.anniversary_list.all())

            if source:
                for model_name in SEASON_LINKED_MODELS:
                    model = apps.get_model('server', model_name)
                    through = model.seasons.through
                    column = '{}_id'.format(model._meta.model_name)
                    through.objects.bulk_create(
                        [
                            through(**{column: pk, 'season_id': season.pk})
                            for pk in model.objects.filter(seasons=source).values_list('pk', flat=True)
                        ],
                        ignore_conflicts=True,
                    )

                Tariff = apps.get_model('server', 'Tariff')
                for tariff in Tariff.objects.filter(season=source):
                    tariff.pk = None
                    tariff.season = season
                    tariff.save()

        return season

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Saison"
        verbose_name_plural = "Saisonen"
        ordering = ('name', )

    def get_public_states(self, with_canceled=False, with_historic=False):
        states = self.state_list.filter(public=True)
        if not with_canceled:
            states = states.exclude(canceled=True)
        if not with_historic:
            states = states.exclude(done=True)
        return states

    def get_canceled_state(self):
        return self.state_list.get(canceled=True)

    def get_tours_by_month(self, month, with_canceled=False, with_historic=False, with_deadline=False, with_preliminary=False):
        year = self.name
        dates = Q(
            tour__start_date__year=year,
            tour__start_date__month=month
        )
        if with_deadline:
            dates = dates | Q(
                deadline__start_date__year=year,
                deadline__start_date__month=month,
            )
        if with_preliminary:
            dates = dates | Q(
                preliminary__isnull=False,
                preliminary__start_date__year=year,
                preliminary__start_date__month=month,
            )
        qs = self.tour_list.filter(
            dates,
            state__in=self.get_public_states(with_canceled=with_canceled, with_historic=with_historic),
            deprecated=False,
            tour__internal=False,
        )
        return qs
