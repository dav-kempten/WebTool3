# -*- coding: utf-8 -*-
"""Trainer dürfen Touren, Kurse und Gruppentermine nur "In Arbeit" bearbeiten.

Ab "Fertig" übernimmt die Geschäftsstelle. Die Sperre muss für jeden Weg zur
Schnittstelle gelten, nicht nur für das PUT, das das Formular schickt: ein POST
mit der Id eines bestehenden Termins landete früher über create() in update()
und an der Objektprüfung vorbei.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from server.models import Collective, Guide, Session
from server.tests.helpers import NEXT, day, post_course, post_tour, state


def make_guide(username, is_staff=False):
    user = get_user_model().objects.create_user(username, f'{username}@example.org', 'x', is_staff=is_staff)
    return Guide.objects.create(user=user)


def client_for(guide):
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(guide.user)
    return client


def set_state(obj, name):
    obj.state = state(name)
    obj.save()


@pytest.fixture
def leader(seeded):
    return make_guide('leiter')


@pytest.fixture
def helper(seeded):
    return make_guide('helfer')


@pytest.fixture
def tour(api, leader):
    tour = post_tour(api, day(NEXT, '06-01'), day(NEXT, '05-01'))
    tour.guide = leader
    tour.save()
    return tour


@pytest.fixture
def course(api, leader, course_topic):
    # Trainer bearbeiten nur Sommer- und Winterkurse (InstructionViewSet).
    course_topic.category.summer = True
    course_topic.category.save()
    course = post_course(api, course_topic, day(NEXT, '06-01'))
    course.guide = leader
    course.save()
    return course


@pytest.fixture
def session(api, leader, seeded):
    from server.models import Category, Section
    category = Category.objects.create(code='GRT', name='Gruppe Test', order=50, collective=True)
    category.seasons.add(seeded)
    collective = Collective.objects.create(
        category=category, section=Section.objects.first(), title='Testgruppe', name='Testgruppe',
    )
    collective.managers.add(leader)
    collective.seasons.add(seeded)
    response = api.post('/api/frontend/sessions/', {
        'collectiveId': collective.pk, 'session': {'startDate': day(NEXT, '06-01')},
    }, format='json')
    assert response.status_code == 201, response.content
    session = Session.objects.get(pk=response.json()['id'])
    session.guide = leader
    session.save()
    return session


KINDS = {
    'tour': '/api/frontend/tours/',
    'course': '/api/frontend/instructions/',
    'session': '/api/frontend/sessions/',
}


@pytest.fixture(params=list(KINDS))
def kind(request):
    return request.param


@pytest.fixture
def item(kind, request):
    return request.getfixturevalue(kind)


def body_with_helper(api, kind, item, helper):
    body = api.get(f'{KINDS[kind]}{item.pk}/').json()
    body['teamIds'] = [helper.pk]
    return body


LOCKED = ['Fertig', 'Freigegeben', 'Veröffentlicht', 'Noch nicht buchbar']


@pytest.mark.parametrize('state_name', LOCKED)
def test_put_is_refused_once_the_event_left_in_arbeit(api, kind, item, leader, helper, state_name):
    set_state(item, state_name)
    body = body_with_helper(api, kind, item, helper)
    response = client_for(leader).put(f'{KINDS[kind]}{item.pk}/', body, format='json')
    assert response.status_code == 403, response.content
    item.refresh_from_db()
    assert list(item.team.all()) == []


@pytest.mark.parametrize('state_name', LOCKED)
def test_post_with_an_existing_id_cannot_bypass_the_lock(api, kind, item, leader, helper, state_name):
    set_state(item, state_name)
    body = body_with_helper(api, kind, item, helper)
    response = client_for(leader).post(KINDS[kind], body, format='json')
    assert response.status_code in (400, 403), response.content
    item.refresh_from_db()
    assert list(item.team.all()) == []


def test_post_with_an_existing_id_cannot_take_over_a_foreign_event(api, kind, item, helper):
    body = body_with_helper(api, kind, item, helper)
    body['guideId'] = helper.pk
    response = client_for(helper).post(KINDS[kind], body, format='json')
    assert response.status_code in (400, 403), response.content
    item.refresh_from_db()
    assert item.guide.user.username == 'leiter'


def test_trainer_may_still_edit_in_arbeit(api, kind, item, leader, helper):
    body = body_with_helper(api, kind, item, helper)
    response = client_for(leader).put(f'{KINDS[kind]}{item.pk}/', body, format='json')
    assert response.status_code == 200, response.content
    item.refresh_from_db()
    assert list(item.team.all()) == [helper]


def test_trainer_may_not_move_the_event_past_fertig(api, kind, item, leader):
    body = api.get(f'{KINDS[kind]}{item.pk}/').json()
    body['stateId'] = state('Freigegeben').pk
    response = client_for(leader).put(f'{KINDS[kind]}{item.pk}/', body, format='json')
    assert response.status_code == 403, response.content


@pytest.mark.parametrize('state_name', LOCKED)
def test_staff_may_edit_in_every_state(api, kind, item, helper, state_name):
    set_state(item, state_name)
    office = make_guide('buero', is_staff=True)
    body = body_with_helper(api, kind, item, helper)
    response = client_for(office).put(f'{KINDS[kind]}{item.pk}/', body, format='json')
    assert response.status_code == 200, response.content
    item.refresh_from_db()
    assert list(item.team.all()) == [helper]


# --- Zurück auf "In Arbeit" ---------------------------------------------------

def test_leader_reopens_a_ready_event(kind, item, leader):
    set_state(item, 'Fertig')
    response = client_for(leader).post(f'{KINDS[kind]}{item.pk}/reopen/', format='json')
    assert response.status_code == 200, response.content
    assert response.json()['stateId'] == state('In Arbeit').pk
    item.refresh_from_db()
    assert item.state == state('In Arbeit')


def test_reopen_changes_nothing_but_the_state(kind, item, leader, helper):
    set_state(item, 'Fertig')
    response = client_for(leader).post(
        f'{KINDS[kind]}{item.pk}/reopen/', {'teamIds': [helper.pk], 'guideId': helper.pk}, format='json',
    )
    assert response.status_code == 200, response.content
    item.refresh_from_db()
    assert list(item.team.all()) == []
    assert item.guide == leader


@pytest.mark.parametrize('state_name', ['In Arbeit', 'Freigegeben', 'Veröffentlicht', 'Noch nicht buchbar'])
def test_only_ready_events_can_be_reopened(kind, item, leader, state_name):
    set_state(item, state_name)
    response = client_for(leader).post(f'{KINDS[kind]}{item.pk}/reopen/', format='json')
    assert response.status_code == 400, response.content
    item.refresh_from_db()
    assert item.state == state(state_name)


def test_others_cannot_reopen(kind, item, helper):
    set_state(item, 'Fertig')
    response = client_for(helper).post(f'{KINDS[kind]}{item.pk}/reopen/', format='json')
    assert response.status_code == 403, response.content
    item.refresh_from_db()
    assert item.state == state('Fertig')


def test_after_reopening_the_leader_may_edit_again(api, kind, item, leader, helper):
    set_state(item, 'Fertig')
    client = client_for(leader)
    assert client.post(f'{KINDS[kind]}{item.pk}/reopen/', format='json').status_code == 200
    body = body_with_helper(api, kind, item, helper)
    response = client.put(f'{KINDS[kind]}{item.pk}/', body, format='json')
    assert response.status_code == 200, response.content
