# -*- coding: utf-8 -*-
import re

from django.core.validators import MaxValueValidator
from django.db import models

from server.models import Season
from .category import Category
from .mixins import SeasonMixin
from .time_base import TimeMixin
from . import defaults

# Nummern je Kategorie, Saison und Jahresziffer. Öffentliche Codes bleiben
# zweistellig (BGT-701 .. BGT-799), damit ihr Format unverändert bleibt; Satelliten
# werden nie veröffentlicht und dürfen dreistellig werden (KT9-7100).
REFERENCE_RANGE = set(range(1, 100))
SATELLITE_REFERENCE_RANGE = set(range(1, 1000))

# CODE-JNN oder CODE-JNNN: Kategorie, Jahresziffer, zwei- oder dreistellige Nummer.
CODE_PATTERN = re.compile(r'([^-]+)-(\d)(\d{2,3})')


def reference_range(category):
    return SATELLITE_REFERENCE_RANGE if category.is_satellite else REFERENCE_RANGE


class ReferenceSpaceExhausted(Exception):
    """All booking codes of one category, season and year digit are taken.

    Replaces the former category-cloning escape hatch. That path derived a new
    category code by incrementing the last character, which raised DataError
    for codes ending in 9 (four characters against a varchar(3) column),
    IntegrityError when the incremented code already existed, and a misleading
    Category.DoesNotExist for the 118 codes that do not end in a digit at all.
    Rolling over into the next year digit is no option either: BGT-701 would
    read as next year.
    """

    def __init__(self, category, season):
        self.category = category
        self.season = season
        super().__init__(
            'Alle {} Buchungscodes der Kategorie "{}" sind in Saison {} vergeben.'.format(
                len(reference_range(category)), category.code, season.name
            )
        )


class ReferenceManager(models.Manager):

    def get_by_natural_key(self, season, category, prefix, reference):
        return self.get(season__name=season, category__code=category, prefix=prefix, reference=reference)


class Reference(SeasonMixin, TimeMixin, models.Model):

    objects = ReferenceManager()

    # noinspection PyUnresolvedReferences
    category = models.ForeignKey(
        'Category',
        db_index=True,
        verbose_name='Kategorie',
        related_name='event_list',
        on_delete=models.PROTECT,
    )

    # 99 for public categories, 999 for satellites -- see reference_range().
    reference = models.PositiveSmallIntegerField(
        verbose_name='Buchungscode',
        validators=[MaxValueValidator(999, 'Bitte keine Zahlen größer 999 eingeben')]
    )

    prefix = models.PositiveSmallIntegerField(
        verbose_name='Jahreszahl',
        validators=[MaxValueValidator(9, 'Bitte keine Zahlen größer 9 eingeben')],
        blank=True, default=defaults.get_default_prefix
    )

    def natural_key(self):
        return self.season.name, self.category.code, self.prefix, self.reference

    natural_key.dependencies = ['server.season', 'server.category']

    def __str__(self):
        return "{}-{}{:02d}".format(self.category.code, self.prefix, self.reference)

    class Meta:
        verbose_name = "Buchungscode"
        verbose_name_plural = "Buchungscodes"
        unique_together = ('season', 'category', 'prefix', 'reference')
        ordering = ('season__name', 'category__order', 'prefix', 'reference')

    @staticmethod
    def parse_code(value):
        """'BGT-712' -> ('BGT', 7, 12), 'KT9-7123' -> ('KT9', 7, 123).

        Raises ValueError for anything else. The former split read only two
        digits, so a three-digit satellite code like KT9-7123 came out as 12.
        """
        match = CODE_PATTERN.fullmatch(value or '')
        if not match:
            raise ValueError('not a booking code: {!r}'.format(value))
        code, prefix, reference = match.groups()
        return code, int(prefix), int(reference)

    @staticmethod
    def get_reference(value, season=None, seasons=None):
        """The Reference a booking code string names.

        season  -- look only there (a Season or its name)
        seasons -- a window of seasons, e.g. Season.visible('client'): the season
                   whose year ends in the code's digit is tried first, then the
                   others newest first. That finds a legacy code too whose digit
                   does not match its season (BGT-712 in season 2026).
        neither -- the current season, as callers without a window always had it
        """
        try:
            code, prefix, reference = Reference.parse_code(value)
        except ValueError:
            # noinspection PyCallByClass
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        if season is None and seasons is not None:
            by_digit_then_newest = sorted(
                seasons, key=lambda s: (s.name[-1] != str(prefix), -int(s.name))
            )
            for candidate in by_digit_then_newest:
                try:
                    return Reference._find(code, prefix, reference, candidate)
                except Reference.DoesNotExist:
                    continue
            # noinspection PyCallByClass
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        if isinstance(season, str):
            try:
                season = Season.objects.get(name=season)
            except Season.DoesNotExist:
                # noinspection PyCallByClass
                raise Reference.DoesNotExist("Reference matching query does not exist.")

        if season is None:
            season = Season.objects.get(current=True)

        return Reference._find(code, prefix, reference, season)

    @staticmethod
    def _find(code, prefix, reference, season):
        try:
            category = Category.objects.get(seasons=season, code=code)
        except Category.DoesNotExist:
            # noinspection PyCallByClass
            raise Reference.DoesNotExist("Reference matching query does not exist.")

        return Reference.objects.get(season=season, category=category, prefix=prefix, reference=reference)

    def move_to(self, season):
        """Re-key this booking code into `season`: its year digit and the lowest
        free number there. The row itself stays -- it is the primary key of its
        event, so tours and courses keep pointing at it."""
        slot = find_free_slot(category=self.category, prefix=int(season.name[-1]), season=season)
        if slot is None:
            raise ReferenceSpaceExhausted(self.category, season)
        self.season = season
        self.prefix, self.reference = slot
        self.save()

    @staticmethod
    def create_reference(category=None, prefix=None, season=None, **kwargs):

        reference = None
        if isinstance(season, str):
            try:
                season = Season.objects.get(name=season)
            except Season.DoesNotExist as exception:
                print('Season "{}" nicht gefunden'.format(season))
                raise exception

        if season is None:
            season = defaults.get_default_season()

        if isinstance(category, str):
            try:
                category = Category.objects.get(code=category, seasons=season, **kwargs)
            except Category.DoesNotExist as exception:
                print('Category "{}" nicht gefunden'.format(category))
                raise exception

        if category is None:
            category = Category.objects.filter(seasons=season, **kwargs).order_by('code').last()
            if category is None:
                print('Category "{}" nicht gefunden'.format(repr(kwargs)))
                # noinspection PyCallByClass
                raise Category.DoesNotExist("Reference matching query does not exist.")

        if prefix is None:
            prefix = int(season.name[-1])

        reference = find_free_references(category=category, prefix=prefix, season=season)

        if reference is None:
            raise ReferenceSpaceExhausted(category, season)
        return reference


def find_free_slot(category=None, prefix=None, season=None):
    """(prefix, number) of the lowest free booking code on this year digit, or
    None if all are taken. There is no rollover into the next digit any more:
    the digit is the year, and BGT-701 in season 2026 would read as 2027."""
    prefix = int(prefix)
    # Bis Plan 3 landeten Veranstaltungen des Folgejahres in der laufenden Saison,
    # mit der Ziffer des Folgejahres (BGT-701 in Saison 2026). Diese Nummern sind
    # für die Saison ihres Jahres mitbelegt, sonst gäbe es den Code-String doppelt.
    seasons = [season]
    if season is not None and season.name.isdigit():
        previous = Season.objects.filter(name=str(int(season.name) - 1)).first()
        if previous:
            seasons.append(previous)

    taken = set(
        Reference.objects.filter(category=category, prefix=prefix, season__in=seasons)
        .values_list('reference', flat=True)
    )
    free = reference_range(category) - taken
    return (prefix, min(free)) if free else None


def find_free_references(category=None, prefix=None, season=None):
    slot = find_free_slot(category=category, prefix=prefix, season=season)
    if slot is None:
        return None
    prefix_idx, number = slot
    return Reference.objects.create(season=season, category=category, prefix=prefix_idx, reference=number)
