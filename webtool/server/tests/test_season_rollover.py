# -*- coding: utf-8 -*-
from io import StringIO

import pytest
from django.core.management import call_command

from server.models import Season


def rollover(today):
    out = StringIO()
    call_command('rollover_season', '--today', today, stdout=out)
    return out.getvalue()


@pytest.mark.django_db
def test_rollover_on_new_year_makes_the_new_year_current(make_season):
    make_season('2026', current=True)

    rollover('2027-01-01')

    assert Season.objects.get(current=True).name == '2027'


@pytest.mark.django_db
def test_rollover_also_prepares_the_following_season(make_season):
    make_season('2026', current=True)

    rollover('2027-01-01')

    assert Season.objects.filter(name='2028').exists()


@pytest.mark.django_db
def test_rollover_within_the_year_only_prepares_next_season(make_season):
    make_season('2026', current=True)

    rollover('2026-06-15')

    assert Season.objects.get(current=True).name == '2026'
    assert sorted(Season.objects.values_list('name', flat=True)) == ['2026', '2027']


@pytest.mark.django_db
def test_rollover_is_idempotent(make_season):
    make_season('2026', current=True)

    rollover('2027-01-01')
    rollover('2027-01-01')

    assert Season.objects.filter(current=True).count() == 1
    assert Season.objects.get(current=True).name == '2027'
    assert Season.objects.filter(name='2028').count() == 1


@pytest.mark.django_db
def test_rollover_works_when_the_new_season_already_exists(make_season):
    """2027 is usually created months earlier, as soon as the first event of
    2027 is entered. The flip must then only move the flag -- respecting the
    partial unique index on current."""
    make_season('2026', current=True)
    make_season('2027')

    rollover('2027-01-01')

    assert Season.objects.get(current=True).name == '2027'
    assert not Season.objects.get(name='2026').current


@pytest.mark.django_db
def test_rollover_reports_what_it_did(make_season):
    make_season('2026', current=True)

    output = rollover('2027-01-01')

    assert '2027' in output and 'current' in output
