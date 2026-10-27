# -*- coding: utf-8 -*-
import pytest
from django.apps import apps

from server.models import Anniversary, Calendar, Category, Season, State, Tariff
from server.models.season import SEASON_LINKED_MODELS


def test_every_model_with_seasons_is_carried_over():
    """Guards SEASON_LINKED_MODELS: a model that gains a `seasons` field later must
    be added there too, or a new season would silently start without it."""
    with_seasons = {
        model.__name__ for model in apps.get_app_config('server').get_models()
        if any(f.name == 'seasons' and f.many_to_many for f in model._meta.get_fields())
    }
    assert set(SEASON_LINKED_MODELS) == with_seasons


@pytest.mark.django_db
def test_for_year_returns_an_existing_season_unchanged(make_season):
    season = make_season('2026', current=True)

    assert Season.for_year(2026) == season
    assert Season.objects.count() == 1


@pytest.mark.django_db
def test_for_year_creates_season_and_calendar(make_season):
    make_season('2026', current=True)

    created = Season.for_year(2027)

    assert created.name == '2027'
    assert Calendar.objects.filter(season=created).exists()


@pytest.mark.django_db
def test_for_year_copies_links_of_the_previous_season(make_season, make_category):
    previous = make_season('2026', current=True)
    category = make_category('BGT')
    category.seasons.add(previous)
    state = State.objects.create(name='In Arbeit', order=1, default=True)
    state.seasons.add(previous)

    created = Season.for_year(2027)

    assert created in category.seasons.all()
    assert created in state.seasons.all()
    # The defaults a new event needs resolve in the new season, too.
    assert created.state_list.get(default=True) == state


@pytest.mark.django_db
def test_for_year_does_not_revive_rows_unlinked_from_the_previous_season(
        make_season, make_category):
    older = make_season('2025')
    previous = make_season('2026', current=True)
    retired = make_category('ALT')
    retired.seasons.add(older)
    kept = make_category('BGT')
    kept.seasons.add(previous)

    created = Season.for_year(2027)

    assert list(Category.objects.filter(seasons=created)) == [kept]


@pytest.mark.django_db
def test_for_year_copies_tariffs_by_name(make_season):
    previous = make_season('2026', current=True)
    Tariff.objects.create(season=previous, name='Mitglied', multiplier=1)

    created = Season.for_year(2027)

    assert list(created.tariff_list.values_list('name', flat=True)) == ['Mitglied']


@pytest.mark.django_db
def test_for_year_carries_over_the_anniversaries_of_the_latest_calendar(make_season):
    previous = make_season('2026', current=True)
    calendar = Calendar.objects.create(season=previous)
    new_year = Anniversary.objects.create(name='Neujahr', fixed_date='01.01.', public_holiday=True)
    new_year.calendars.add(calendar)

    created = Season.for_year(2027)

    assert list(created.calendar.anniversary_list.all()) == [new_year]


@pytest.mark.django_db
def test_for_year_is_idempotent(make_season, make_category):
    previous = make_season('2026', current=True)
    make_category('BGT').seasons.add(previous)
    Tariff.objects.create(season=previous, name='Mitglied', multiplier=1)

    first = Season.for_year(2027)
    second = Season.for_year(2027)

    assert first == second
    assert Season.objects.filter(name='2027').count() == 1
    assert Tariff.objects.filter(season=first).count() == 1


@pytest.mark.django_db
def test_for_year_never_changes_the_current_flag(make_season):
    previous = make_season('2026', current=True)

    Season.for_year(2027)

    assert Season.objects.get(current=True) == previous
