# -*- coding: utf-8 -*-

import datetime
from django.core.cache import cache
from django.template.defaultfilters import date
from django.db import models

from .time_base import TimeMixin
from . import fields, defaults


MONTH_CHOICES = (
    (1,  'Januar'),
    (2,  'Februar'),
    (3,  'März'),
    (4,  'April'),
    (5,  'Mai'),
    (6,  'Juni'),
    (7,  'Juli'),
    (8,  'August'),
    (9,  'September'),
    (10, 'Oktober'),
    (11, 'November'),
    (12, 'Dezember'),
)

DAY_CHOICES = (
    (0, 'Montag'),
    (1, 'Dienstag'),
    (2, 'Mittwoch'),
    (3, 'Donnerstag'),
    (4, 'Freitag'),
    (5, 'Samstag'),
    (6, 'Sonntag'),
)

OCCURRENCE_CHOICES = (
    (1, 'Erster'),
    (2, 'Zweiter'),
    (3, 'Dritter'),
    (4, 'Vierter'),
    (5, 'Fünfter'),
    (-1, 'Letzter'),
    (-2, 'Vorletzter'),
    (-3, 'Drittletzter'),
    (-4, 'Viertletzter'),
    (-5, 'Fünftletzter'),
)

easter_cache = {}
advent_cache = {}


class CalendarManager(models.Manager):

    def get_by_natural_key(self, season):
        return self.get(season__name=season)


class Calendar(TimeMixin, models.Model):

    objects = CalendarManager()

    season = models.OneToOneField(
        'Season',
        primary_key=True,
        verbose_name='Saison',
        related_name='calendar',
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_season
    )

    @property
    def start_date(self):
        return datetime.date(int(self.season.name), 1, 1)

    @property
    def end_date(self):
        return datetime.date(int(self.season.name), 12, 31)

    def natural_key(self):
        return self.season.name,

    natural_key.dependencies = ['server.season']

    def __str__(self):
        return "Kalender für {}".format(self.season.name)

    class Meta:
        verbose_name = "Kalender"
        verbose_name_plural = "Kalender"
        ordering = ('season__name', )

    def calc_anniversary_order(self):
        dates = sorted(
            [
                (a.date(int(self.season.name)), a.pk) for a in self.anniversary_list.all()
            ]
        )
        for order, (current_date, pk) in enumerate(dates, start=1):
            anniversary = Anniversary.objects.get(pk=pk)
            anniversary.order = order
            if anniversary.advent_offset == 21:
                # The 4th advent will not celebrated, if it is at 24th of december
                anniversary.deprecated = (current_date.month == 12 and current_date.day == 24)
            anniversary.save()


class AnniversaryManager(models.Manager):

    def get_by_natural_key(self, season, name):
        return self.get(calendar__season__name=season, name=name)


class Anniversary(TimeMixin, models.Model):

    calendar = models.ForeignKey(
        'Calendar',
        db_index=True,
        verbose_name='Kalender',
        related_name='anniversary_list',
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_calendar
    )

    name = fields.NameField(
        verbose_name='Name',
        help_text=None
    )

    public_holiday = models.BooleanField(
        'Arbeitsfrei',
        blank=True, default=False
    )

    order = fields.OrderField()

    # Four possibilities to define a Anniversary:
    # 1.) fixed_date != '' => day_occurrence, weekday, month, easter_offset and advent_offset are None
    # 2.) day_occurrence, weekday and month are not None => fixed_date == '', easter_offset and advent_offset are None
    # 3.) easter_offset is not None => fixed_date == '', day_occurrence, weekday, month and advent_offset are None
    # 4.) advent_offset is not None => fixed_date == '', day_occurrence, weekday, month and easter_offset are None

    fixed_date = models.CharField(
        'Konstante',
        max_length=6,
        blank=True, null=True,
        help_text="Ein festes Datum im Format: TT.MM.",
    )

    day_occurrence = models.SmallIntegerField(
        'Zähloffset',
        choices=OCCURRENCE_CHOICES,
        blank=True, null=True,
        help_text="Ein bewegliches Datum, ein bestimmter (erste, zweite, ...) Wochentag im Monat",
    )

    weekday = models.PositiveSmallIntegerField(
        'Wochentag',
        choices=DAY_CHOICES,
        blank=True, null=True,
    )

    month = models.PositiveSmallIntegerField(
        'Monat',
        choices=MONTH_CHOICES,
        blank=True, null=True,
    )

    easter_offset = models.SmallIntegerField(
        'Osteroffset',
        blank=True, null=True
    )

    advent_offset = models.SmallIntegerField(
        'Adventoffset',
        blank=True, null=True,
    )

    @property
    def season(self):
        return self.calendar.season

    def natural_key(self):
        return self.calendar.season.name, self.name

    natural_key.dependencies = ['server.season', 'server.calendar']

    def __str__(self):
        year = int(self.season.name)
        return "{} {} [{}]".format(self.name, date(self.date(year), "d.m."), self.season.name)

    class Meta:
        verbose_name = "Gedenktag"
        verbose_name_plural = "Gedenktage"
        unique_together = ('calendar', 'name')
        ordering = ('order', 'name')

    @staticmethod
    def easter(year):
        """
        Calculation of easter sunday to Gauss.
        Further information:
        http://www.ptb.de/de/org/4/44/441/oste.htm
        And
        H. Lichtenberg,
        Zur Interpretation der Gaußschen Osterformel und ihrer Ausnahmeregeln,
        Historia Mathematica 24, 441 - 444 (1997)
        """
        global easter_cache

        ret = easter_cache.get(year)
        if ret:
            return ret

        ret = cache.get("easter.{}".format(year))
        if ret:
            easter_cache[year] = ret
            return ret

        x = year
        offset = 0

        k = x // 100
        m = 15 + ((3*k+3)//4) - ((8*k+13)//25)
        s = 2 - ((3*k+3)//4)
        a = x % 19
        d = (19*a+m) % 30
        r = (d//29) + ((d//28) - (d//29)) * (a//11)
        og = 21 + d - r
        sz = 7 - (x + (x//4)+s) % 7
        oe = 7 - ((og-sz) % 7)

        tmp = og + oe  # das Osterdatum als n-ter Tag des März, also 32 entspricht 1. April
        if tmp > 31:  # Monat erhöhen, tmp=tag erniedrigen
            offset = tmp // 31
            tmp -= 31

        ret = datetime.date(x, 3+offset, tmp)
        easter_cache[year] = ret
        cache.set("easter.{}".format(year), ret, None)
        return ret

    @staticmethod
    def advent(year):
        """
        Calculate the Date of the first Advent.
        Der erste Advent ist der Sonntag zwischen dem 27.11. und dem 03.12.
        Er kann mit dem Heiligen Abend zusammen fallen und wird dann nicht gefeiert.
        """
        global advent_cache

        tmp = advent_cache.get(year)
        if tmp:
            return tmp

        tmp = cache.get("advent.{}".format(year))
        if tmp:
            advent_cache[year] = tmp
            return tmp

        for t in range(27, 37):
            if t > 30:
                m = 12
                d = t % 30
            else:
                m = 11
                d = t
            tmp = datetime.date(year, m, d)
            if tmp.weekday() == 6:
                advent_cache[year] = tmp
                cache.set("advent.{}".format(year), tmp, None)
                return tmp

    @staticmethod
    def nth_weekday_in_month(year, month, n, day):
        """
        Calculates the nth. occurency of Day in Month.

        For Example the second sunday in May:
        Muttertag = nth_week_day_in_month(2008, 5, 2, 6)
        # where 5 means May, and 6 means Sunday and we want the second sunday in May
        # use negative n for calculation relative to the end of the month:
        Lug = nth_week_day_in_month(2008, 3, -1, 1)
        The last (-1) Monday (1) in March.
        """

        assert int(n) != 0

        if 0 < n:
            first = datetime.date(year, month, 1)
            diff = (day - first.weekday()) % 7
            return first + datetime.timedelta(diff + (n-1) * 7)
        else:
            if month < 12:
                first = datetime.date(year, month + 1, 1)
            else:
                first = datetime.date(year + 1, 1, 1)
            diff = - ((first.weekday() - day) % 7)
            if diff == 0:
                # First is the first day of the next month, which is wrong (n < 0).
                # diff is zero if accidentally first.weekday() == day,
                # so we skip one week back:
                diff = -7
                # n is negative:
            return first + datetime.timedelta(diff + (n + 1) * 7)

    def date(self, year=datetime.date.today().year+1):
        if self.fixed_date:
            day, month = self.fixed_date.split('.')[:-1]
            return datetime.date(year, int(month), int(day))
        if self.day_occurrence is not None and self.weekday is not None and self.month is not None:
            return self.nth_weekday_in_month(year, self.month, self.day_occurrence, self.weekday)
        if self.easter_offset is not None:
            easter = self.easter(year)
            easter_offset = self.easter_offset
            return easter + datetime.timedelta(float(easter_offset))
        if self.advent_offset is not None:
            advent = self.advent(year)
            advent_offset = self.advent_offset
            return advent + datetime.timedelta(float(advent_offset))

    date.short_description = 'Datum'

    def day_definition(self):
        if self.fixed_date:
            return self.fixed_date
        if self.day_occurrence is not None and self.weekday is not None and self.month is not None:
            odm = (self.get_day_occurrence_display(), self.get_weekday_display(), self.get_month_display())
            return "{} {} im {}".format(*odm)
        if self.easter_offset is not None:
            easter_offset = self.easter_offset
            if abs(easter_offset) == 1:
                day = 'Tag'
            else:
                day = 'Tage'
            if easter_offset > 0:
                return "{} {} nach Ostern".format(easter_offset, day)
            elif easter_offset < 0:
                return "{} {} vor Ostern".format(-easter_offset, day)
            else:
                return 'An Ostern'
        if self.advent_offset is not None:
            advent_offset = self.advent_offset
            if abs(advent_offset) == 1:
                day = 'Tag'
            else:
                day = 'Tage'
            if advent_offset > 0:
                return "{} {} nach dem 1. Advent".format(advent_offset, day)
            elif advent_offset < 0:
                return "{} {} vor dem 1. Advent".format(-advent_offset, day)
            else:
                return 'Am 1. Advent'

    day_definition.short_description = 'Definition'


class VacationManager(models.Manager):

    def get_by_natural_key(self, season, name):
        return self.get(calendar__season__name=season, name=name)


class Vacation(TimeMixin, models.Model):

    calendar = models.ForeignKey(
        'Calendar',
        db_index=True,
        verbose_name='Kalender',
        related_name='vacation_list',
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_calendar
    )

    name = fields.NameField(
        verbose_name='Name',
        help_text=None
    )

    start_date = models.DateField(
        'Beginn'
    )

    end_date = models.DateField(
        'Ende'
    )

    def natural_key(self):
        return self.calendar.season.name, self.name

    natural_key.dependencies = ['server.season', 'server.calendar']

    def __str__(self):
        return "{} [{}]".format(self.name, self.calendar.season)

    class Meta:
        verbose_name = "Ferien"
        verbose_name_plural = "Ferien"
        unique_together = ('calendar', 'name')
        ordering = ('start_date', 'name')


def parse_date(value):

    checks = (
        ('day', '%Y-%m-%d'),
        ('month', '%Y-%m'),
        ('year', '%Y')
    )
    one_day = datetime.timedelta(days=1)

    start_date = None
    end_date = None

    for mode, check in checks:
        try:
            start_date = datetime.datetime.strptime(value, check).date()
        except ValueError:
            pass
        else:
            if mode == 'day':
                end_date = start_date
            elif mode == 'month':
                month = start_date.month
                year = start_date.year
                if month == 12:
                    month = 1
                    year += 1
                else:
                    month += 1
                end_date = start_date.replace(year=year, month=month, day=1) - one_day
            elif mode == 'year':
                end_date = start_date.replace(month=12, day=31)
            break
    return start_date, end_date if not(start_date is None or end_date is None) else None
