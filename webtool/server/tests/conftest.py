# -*- coding: utf-8 -*-
"""Fixtures für die Buchungscode-Tests.

Absichtlich schmal gehalten: ein Event braucht nur reference, season, title,
name und start_date: alle anderen Spalten haben einen Django-Default. Ein Event
ohne Tour/Kurs/Vortrag/Gruppentermin passiert alle .exclude()-Klauseln der
Client-API und ist damit sichtbar -- das reicht, um die Auflösung zu testen,
ohne den schweren Tour-Fixture-Baum aufzubauen.
"""
import datetime

import pytest

from server.models import Category, Event, Reference, Season


@pytest.fixture
def make_season(db):
    def make(name, current=False):
        return Season.objects.create(name=str(name), current=current)
    return make


@pytest.fixture
def make_category(db):
    def make(code, name=None, order=10):
        return Category.objects.create(code=code, name=name or code, order=order)
    return make


@pytest.fixture
def make_booking_code(db):
    def make(season, category, prefix, reference, title='Testtour'):
        # Reference.get_reference only looks at categories assigned to the
        # season (Category.seasons); init_season does that for real data.
        category.seasons.add(season)
        ref = Reference.objects.create(
            season=season, category=category, prefix=prefix, reference=reference,
        )
        Event.objects.create(
            reference=ref,
            season=season,
            title=title,
            name=title,
            start_date=datetime.date(int(season.name), 6, 1),
        )
        return str(ref)
    return make
