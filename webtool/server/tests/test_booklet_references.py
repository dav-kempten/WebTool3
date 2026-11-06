# -*- coding: utf-8 -*-
"""
A booklet accepts every code the homepage lists. In November 2026 the
activities already show season 2027, but the booklet only looked in the
current season and rejected AVS-701 with "Reference 'AVS-701' is not valid."
"""
import dramatiq
import pytest
from dramatiq.brokers.stub import StubBroker
from rest_framework.test import APIClient

# Before the actors are imported, or create() would talk to RabbitMQ.
dramatiq.set_broker(StubBroker())

from server.models import Booklet  # noqa: E402

pytestmark = pytest.mark.django_db

URL = '/api/client/booklets/'


@pytest.fixture
def seasons(make_season):
    """2026 is current, 2027 the next season the client window already shows."""
    return {name: make_season(name, current=(name == '2026')) for name in ('2025', '2026', '2027')}


@pytest.fixture
def client(settings):
    # The test client's host; production only allows webtool.dav-kempten.de.
    settings.ALLOWED_HOSTS = ['testserver']
    return APIClient()


def order(client, *references):
    return client.post(URL, {'references': list(references), 'format': 'desktop'}, format='json')


def test_next_seasons_code_is_accepted(client, seasons, make_category, make_booking_code):
    code = make_booking_code(seasons['2027'], make_category('AVS'), prefix=7, reference=1)

    response = order(client, code)

    assert response.status_code == 201, response.json()
    assert Booklet.objects.get(pk=response.json()['id']).references == [code]


def test_this_and_next_season_mix(client, seasons, make_category, make_booking_code):
    category = make_category('AVS')
    this = make_booking_code(seasons['2026'], category, prefix=6, reference=1)
    following = make_booking_code(seasons['2027'], category, prefix=7, reference=1)

    assert order(client, this, following).status_code == 201


def test_last_seasons_code_is_refused(client, seasons, make_category, make_booking_code):
    """2025 is outside the client window, as on the homepage."""
    code = make_booking_code(seasons['2025'], make_category('AVS'), prefix=5, reference=1)

    response = order(client, code)

    assert response.status_code == 400
    assert response.json() == {'references': [f"Reference '{code}' is not valid."]}


def test_unknown_code_is_refused(client, seasons):
    assert order(client, 'AVS-799').status_code == 400


def test_next_seasons_event_is_rendered(seasons, make_category, make_booking_code):
    code = make_booking_code(seasons['2027'], make_category('AVS'), prefix=7, reference=1, title='Lawinenkurs')
    booklet = Booklet.objects.create(references=[code])

    assert 'LAWINENKURS' in booklet.render_source()
