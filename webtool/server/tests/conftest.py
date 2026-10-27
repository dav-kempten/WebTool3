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


# --- Echte Touren und Kurse über die Frontend-API (Helfer in helpers.py) ------

@pytest.fixture
def seeded(db):
    """Reference data from init_season, its season renamed to the real current
    year so the frontend API's window includes the test events."""
    from django.core.management import call_command

    from server.tests.helpers import THIS

    call_command('init_season')
    season = Season.objects.get(current=True)
    season.name = str(THIS)
    season.save()
    return season


@pytest.fixture
def api(seeded):
    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient

    admin = get_user_model().objects.create_superuser('admin', 'admin@example.org', 'x')
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(admin)
    return client


@pytest.fixture
def course_topic(seeded):
    """init_season seeds no course topics and no course-meeting category."""
    from server.models import Topic

    category = Category.objects.create(code='GKX', name='Grundkurs Test', order=10, topic=True)
    category.seasons.add(seeded)
    meeting = Category.objects.create(code='KT0', name='Kurstermin', order=99, meeting=True)
    meeting.seasons.add(seeded)
    topic = Topic.objects.create(category=category, title='Grundkurs Test', name='Grundkurs Test')
    topic.seasons.add(seeded)
    return topic
