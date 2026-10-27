# -*- coding: utf-8 -*-
import pytest

from server.models import Category, Reference, ReferenceSpaceExhausted


def fill(season, category, prefix, numbers, skip=None):
    """Occupy the given numbers of one (season, category, year digit)."""
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=prefix, reference=n)
        for n in numbers
        if n != skip
    ])


def satellite(make_category, code='KT9'):
    category = make_category(code)
    category.meeting = True
    category.save()
    return category


@pytest.mark.django_db
def test_create_reference_fills_the_lowest_gap_of_its_year_digit(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('BGT')
    fill(season, category, 5, range(1, 100), skip=42)

    created = Reference.create_reference(category=category, prefix=5, season=season)

    assert (created.prefix, created.reference) == (5, 42)


@pytest.mark.django_db
def test_a_public_category_never_leaves_its_year_digit(make_season, make_category):
    """BGT-601 .. BGT-699 is all 2026 has. A 100th code used to roll over to
    BGT-701, which reads as 2027."""
    season = make_season('2026', current=True)
    category = make_category('BGT')
    fill(season, category, 6, range(1, 100))

    with pytest.raises(ReferenceSpaceExhausted) as excinfo:
        Reference.create_reference(category=category, prefix=6, season=season)

    assert not Reference.objects.filter(season=season, category=category, prefix=7).exists()
    assert 'BGT' in str(excinfo.value)
    assert '2026' in str(excinfo.value)
    assert '99' in str(excinfo.value)
    assert excinfo.value.category == category
    assert excinfo.value.season == season


@pytest.mark.django_db
def test_a_full_category_is_not_cloned(make_season, make_category):
    """The old escape hatch invented a new category code from an internal
    counter. For KT1 it would have created KT2, for KT9 a four character code
    the column cannot hold."""
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category, 5, range(1, 100))

    with pytest.raises(ReferenceSpaceExhausted):
        Reference.create_reference(category=category, prefix=5, season=season)

    assert Category.objects.count() == 1
    assert not Category.objects.filter(code='KT2').exists()


@pytest.mark.django_db
def test_a_satellite_category_continues_with_three_digits(make_season, make_category):
    """Course meetings and deadlines are never published, so they may go past 99
    -- on their own year digit, not on the next year's."""
    season = make_season('2027', current=True)
    category = satellite(make_category)
    fill(season, category, 7, range(1, 100))

    created = Reference.create_reference(category=category, prefix=7, season=season)

    assert (created.prefix, created.reference) == (7, 100)
    assert str(created) == 'KT9-7100'


@pytest.mark.django_db
def test_a_satellite_category_is_exhausted_after_999(make_season, make_category):
    season = make_season('2027', current=True)
    category = satellite(make_category)
    fill(season, category, 7, range(1, 1000))

    with pytest.raises(ReferenceSpaceExhausted) as excinfo:
        Reference.create_reference(category=category, prefix=7, season=season)

    assert '999' in str(excinfo.value)


def test_parse_code_reads_two_and_three_digit_numbers():
    assert Reference.parse_code('BGT-712') == ('BGT', 7, 12)
    assert Reference.parse_code('KT9-7123') == ('KT9', 7, 123)
    assert Reference.parse_code('KT9-7100') == ('KT9', 7, 100)


def test_parse_code_rejects_a_malformed_code():
    for value in ('BGT', 'BGT-7', 'BGT-71', 'BGT-71234', 'BGT-7123x'):
        with pytest.raises(ValueError):
            Reference.parse_code(value)


@pytest.mark.django_db
def test_three_digit_codes_round_trip(make_season, make_category):
    season = make_season('2027', current=True)
    category = satellite(make_category)
    category.seasons.add(season)
    reference = Reference.objects.create(season=season, category=category, prefix=7, reference=123)

    assert Reference.get_reference(str(reference), season=season) == reference


@pytest.mark.django_db
def test_public_codes_stay_seven_characters(make_season, make_category):
    """Booklet stores codes as text with max_length=7; only public codes go there."""
    season = make_season('2027', current=True)
    category = make_category('BGT')
    fill(season, category, 7, range(1, 99))

    last = Reference.create_reference(category=category, prefix=7, season=season)

    assert str(last) == 'BGT-799'
    assert len(str(last)) == 7


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
    fill(season, category, 5, range(1, 100))

    with pytest.raises(drf_serializers.ValidationError) as excinfo:
        create_event(
            {'pk': None, 'deprecated': False, 'start_date': datetime.date(2025, 6, 1)},
            {'category': category, 'season': season, 'type': {}},
        )

    assert 'reference' in excinfo.value.detail


@pytest.mark.django_db
def test_check_reference_space_measures_a_public_category_per_year_digit(
        make_season, make_category):
    """A public code carries the year digit, so BGT has 99 codes per year."""
    from io import StringIO

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = make_category('BGT')
    fill(season, category, 6, range(1, 58))
    fill(season, category, 7, range(1, 5))

    out = StringIO()
    call_command('check_reference_space', '--threshold', '100', stdout=out)
    lines = out.getvalue().splitlines()

    assert any('BGT' in line and ' 6 ' in line and '57/99' in line for line in lines)
    assert any('BGT' in line and ' 7 ' in line and '4/99' in line for line in lines)


@pytest.mark.django_db
def test_check_reference_space_measures_a_satellite_category_against_999(
        make_season, make_category):
    from io import StringIO

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = satellite(make_category)
    fill(season, category, 6, range(1, 199))

    out = StringIO()
    call_command('check_reference_space', '--threshold', '100', stdout=out)

    assert any('KT9' in line and '198/999' in line for line in out.getvalue().splitlines())


@pytest.mark.django_db
def test_check_reference_space_fails_above_the_threshold(make_season, make_category):
    from django.core.management.base import CommandError

    from django.core.management import call_command

    season = make_season('2026', current=True)
    category = make_category('BGT')
    fill(season, category, 6, range(1, 60))

    with pytest.raises(CommandError):
        call_command('check_reference_space', '--threshold', '50')
