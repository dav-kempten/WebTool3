# -*- coding: utf-8 -*-
"""Plan 3, Task 5: a bare booking code resolves through its year digit."""
import pytest

from server.models import Reference, Season


@pytest.fixture
def seasons(make_season):
    """2026 is current; 2025 and 2027 around it, as they exist in production."""
    return {name: make_season(name, current=(name == '2026')) for name in ('2025', '2026', '2027')}


@pytest.mark.django_db
def test_visible_seasons(seasons):
    assert [s.name for s in Season.visible('client')] == ['2027', '2026']
    assert [s.name for s in Season.visible('frontend')] == ['2027', '2026', '2025']


@pytest.mark.django_db
def test_a_code_resolves_to_the_season_of_its_year_digit(seasons, make_category, make_booking_code):
    make_booking_code(seasons['2027'], make_category('BGT'), prefix=7, reference=1)

    reference = Reference.get_reference('BGT-701', seasons=Season.visible('client'))

    assert reference.season.name == '2027'


@pytest.mark.django_db
def test_a_code_of_this_year_still_resolves(seasons, make_category, make_booking_code):
    make_booking_code(seasons['2026'], make_category('BGT'), prefix=6, reference=12)

    assert Reference.get_reference('BGT-612', seasons=Season.visible('client')).season.name == '2026'


@pytest.mark.django_db
def test_ten_years_later_the_season_in_the_window_wins(
        seasons, make_season, make_category, make_booking_code):
    category = make_category('BGT')
    make_booking_code(make_season('2016'), category, prefix=6, reference=12, title='2016')
    make_booking_code(seasons['2026'], category, prefix=6, reference=12, title='2026')

    assert Reference.get_reference('BGT-612', seasons=Season.visible('client')).season.name == '2026'


@pytest.mark.django_db
def test_a_legacy_code_with_a_foreign_digit_is_still_found(seasons, make_category, make_booking_code):
    """Before plan 3 a 2027 event sat in season 2026 as BGT-712."""
    make_booking_code(seasons['2026'], make_category('BGT'), prefix=7, reference=12)

    assert Reference.get_reference('BGT-712', seasons=Season.visible('client')).season.name == '2026'


@pytest.mark.django_db
def test_without_a_window_the_current_season_is_used_as_before(seasons, make_category, make_booking_code):
    """booklet, admin import and replication call get_reference without seasons."""
    make_booking_code(seasons['2026'], make_category('BGT'), prefix=6, reference=12)

    assert Reference.get_reference('BGT-612').season.name == '2026'


@pytest.mark.django_db
def test_the_bare_route_uses_the_year_digit(client, seasons, make_category, make_booking_code):
    category = make_category('BGT')
    make_booking_code(seasons['2026'], category, prefix=6, reference=1, title='Tour 2026')
    make_booking_code(seasons['2027'], category, prefix=7, reference=1, title='Tour 2027')

    response = client.get('/api/client/activities/BGT-701/')

    assert response.status_code == 200
    assert response.json()['title'] == 'Tour 2027'


@pytest.mark.django_db
def test_client_detail_outside_the_window_is_404(client, seasons, make_category, make_booking_code):
    """D2: the client API serves only this and next season."""
    make_booking_code(seasons['2025'], make_category('BGT'), prefix=5, reference=1)

    assert client.get('/api/client/activities/BGT-501/').status_code == 404
