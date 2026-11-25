# -*- coding: utf-8 -*-
"""
Die Homepage-Vorschau eines Gruppentermins (/api/frontend/sessions/<id>/preview/):
derselbe Inhalt wie in der Client-API, auch solange der Termin unveröffentlicht ist.
"""
import pytest

from server.models import Category, Collective, Section, Session
from server.tests.helpers import NEXT, day

pytestmark = pytest.mark.django_db


@pytest.fixture
def session(api, seeded):
    category = Category.objects.create(code='GRX', name='Testgruppe', order=10, collective=True)
    category.seasons.add(seeded)
    collective = Collective.objects.create(
        category=category, section=Section.objects.first(), title='Testgruppe', name='Testgruppe',
    )
    collective.seasons.add(seeded)
    response = api.post('/api/frontend/sessions/', {
        'collectiveId': collective.pk,
        'session': {'startDate': day(NEXT, '03-14')},
    }, format='json')
    assert response.status_code == 201, response.content
    session = Session.objects.get(pk=response.json()['id'])
    event = session.session
    event.name = 'Hüttenabend am Kempter Haus'
    event.description = 'Gemütlicher Abend.'
    event.save()
    return session


def test_preview_shows_what_the_homepage_receives(api, session):
    response = api.get('/api/frontend/sessions/{}/preview/'.format(session.pk))
    assert response.status_code == 200, response.content
    assert response['Cache-Control'] == 'no-store'
    data = response.json()
    assert data['id'] == str(session.session.reference)
    assert data['startDate'] == day(NEXT, '03-14')
    assert data['description'].startswith('<h3>Hüttenabend am Kempter Haus</h3>')
    # The homepage gets no guide, participants or fee for group dates.
    assert data['guide'] is None
    assert data['quantity'] is None
    assert data['admission'] is None


def test_preview_needs_a_login(session):
    from rest_framework.test import APIClient

    response = APIClient(HTTP_HOST='localhost').get('/api/frontend/sessions/{}/preview/'.format(session.pk))
    assert response.status_code in (401, 403)
