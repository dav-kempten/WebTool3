# -*- coding: utf-8 -*-
import pytest

from server.models import Category, Reference, ReferenceSpaceExhausted


def fill(season, category, skip=None):
    """Occupy all 990 slots of one (season, category), optionally leaving one free."""
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=p, reference=r)
        for p in range(10)
        for r in range(1, 100)
        if (p, r) != skip
    ])


@pytest.mark.django_db
def test_create_reference_uses_the_last_free_slot(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category, skip=(7, 42))

    created = Reference.create_reference(category=category, prefix=5, season=season)

    assert (created.prefix, created.reference) == (7, 42)


@pytest.mark.django_db
def test_create_reference_raises_when_every_slot_is_taken(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted) as excinfo:
        Reference.create_reference(category=category, prefix=5, season=season)

    assert 'KT1' in str(excinfo.value)
    assert '2025' in str(excinfo.value)
    assert excinfo.value.category == category
    assert excinfo.value.season == season


@pytest.mark.django_db
def test_a_full_category_is_not_cloned(make_season, make_category):
    """The old escape hatch invented a new category code from an internal
    counter. For KT1 it would have created KT2, for KT9 a four character code
    the column cannot hold."""
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted):
        Reference.create_reference(category=category, prefix=5, season=season)

    assert Category.objects.count() == 1
    assert not Category.objects.filter(code='KT2').exists()


@pytest.mark.django_db
def test_create_event_reports_exhaustion_as_a_validation_error(
        make_season, make_category):
    """Unhandled, this used to surface as HTTP 500 when a guide tried to create
    an event in a full category."""
    import datetime

    from rest_framework import serializers as drf_serializers

    from server.serializers.frontend.core import create_event

    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(drf_serializers.ValidationError) as excinfo:
        create_event(
            {'pk': None, 'deprecated': False, 'start_date': datetime.date(2025, 6, 1)},
            {'category': category, 'season': season, 'type': {}},
        )

    assert 'reference' in excinfo.value.detail


@pytest.mark.django_db
def test_check_reference_space_measures_a_public_category_per_year_digit(
        make_season, make_category):
    """A public code carries the year digit, so BGT has 99 codes per year, not
    990: overflowing into the next digit would print the wrong year."""
    from io import StringIO

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = make_category('BGT')
    Reference.objects.bulk_create(
        [Reference(season=season, category=category, prefix=6, reference=r) for r in range(1, 58)]
        + [Reference(season=season, category=category, prefix=7, reference=r) for r in range(1, 5)]
    )

    out = StringIO()
    call_command('check_reference_space', '--threshold', '100', stdout=out)
    lines = out.getvalue().splitlines()

    assert any('BGT' in line and ' 6 ' in line and '57/99' in line for line in lines)
    assert any('BGT' in line and ' 7 ' in line and '4/99' in line for line in lines)


@pytest.mark.django_db
def test_check_reference_space_measures_a_satellite_category_as_a_whole(
        make_season, make_category):
    """Course meetings and deadlines never reach the homepage; they may spread
    over all ten digits."""
    from io import StringIO

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = make_category('KT9')
    category.meeting = True
    category.save()
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=p, reference=r)
        for p in (6, 7) for r in range(1, 100)
    ])

    out = StringIO()
    call_command('check_reference_space', stdout=out)

    assert '198/990' in out.getvalue()


@pytest.mark.django_db
def test_check_reference_space_fails_above_the_threshold(make_season, make_category):
    from django.core.management.base import CommandError

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = make_category('BGT')
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=6, reference=r)
        for r in range(1, 60)
    ])

    with pytest.raises(CommandError):
        call_command('check_reference_space', '--threshold', '50')
