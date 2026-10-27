# -*- coding: utf-8 -*-
import pytest

from server.models import Event, Reference


@pytest.mark.django_db
def test_make_booking_code_creates_a_resolvable_reference(
        make_season, make_category, make_booking_code):
    season = make_season('2025', current=True)
    category = make_category('BGT')

    code = make_booking_code(season, category, prefix=0, reference=12)

    assert code == 'BGT-012'
    assert Reference.objects.filter(season=season, category=category).count() == 1
    assert Event.objects.filter(season=season).count() == 1
    assert Reference.get_reference('BGT-012').season == season


@pytest.mark.django_db
def test_the_same_code_can_exist_in_two_seasons(
        make_season, make_category, make_booking_code):
    """This is the ambiguity the whole spec is about -- unique_together is
    per season, so the string BGT-012 is free to repeat."""
    category = make_category('BGT')
    old = make_season('2022')
    new = make_season('2023', current=True)

    make_booking_code(old, category, prefix=0, reference=12)
    make_booking_code(new, category, prefix=0, reference=12)

    assert Reference.objects.filter(category=category, prefix=0, reference=12).count() == 2
