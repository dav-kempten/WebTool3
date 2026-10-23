# -*- coding: utf-8 -*-
"""Plan 3, Task 3: an event belongs to the season of its start year.

These tests create real tours and courses through the frontend API, so they
need reference data: init_season seeds a current season with categories,
states, skills and fitness. The fixture renames it to the real current year,
because the frontend API only serves recent events.
"""
import datetime

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.test import APIClient

from server.models import Category, Instruction, Season, State, Topic, Tour


THIS = datetime.date.today().year
NEXT = THIS + 1


def day(year, month_day):
    return "{}-{}".format(year, month_day)


@pytest.fixture
def seeded(db):
    call_command("init_season")
    season = Season.objects.get(current=True)
    season.name = str(THIS)
    season.save()
    return season


@pytest.fixture
def api(seeded):
    admin = get_user_model().objects.create_superuser('admin', 'admin@example.org', 'x')
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(admin)
    return client


def state(name):
    return State.objects.get(name=name, seasons__current=True)


def post_tour(api, start, deadline, preliminary=None, state_name='In Arbeit'):
    season = Season.objects.get(current=True)
    body = {
        'category': Category.objects.get(code='SKT').pk,
        'tour': {'startDate': start},
        'deadline': {'startDate': deadline},
        'guideId': None,
        'skillId': season.skill_list.order_by('pk').first().pk,
        'fitnessId': season.fitness_list.order_by('pk').first().pk,
        'stateId': state(state_name).pk,
    }
    if preliminary:
        body['preliminary'] = {'startDate': preliminary}
    response = api.post('/api/frontend/tours/', body, format='json')
    assert response.status_code == 201, response.content
    return Tour.objects.get(pk=response.json()['id'])


def put(api, url, change):
    body = api.get(url).json()
    change(body)
    response = api.put(url, body, format='json')
    assert response.status_code == 200, response.content
    return response.json()


@pytest.fixture
def topic(seeded):
    """init_season seeds no course topics and no course-meeting category."""
    category = Category.objects.create(code='GKX', name='Grundkurs Test', order=10, topic=True)
    category.seasons.add(seeded)
    meeting = Category.objects.create(code='KT0', name='Kurstermin', order=99, meeting=True)
    meeting.seasons.add(seeded)
    topic = Topic.objects.create(category=category, title='Grundkurs Test', name='Grundkurs Test')
    topic.seasons.add(seeded)
    return topic


def post_course(api, topic, start):
    body = {
        'topicId': topic.pk,
        'instruction': {'startDate': start},
        'guideId': None,
        'stateId': state('In Arbeit').pk,
        'isSpecial': False,
    }
    response = api.post('/api/frontend/instructions/', body, format='json')
    assert response.status_code == 201, response.content
    return Instruction.objects.get(pk=response.json()['id'])


def test_a_tour_in_next_year_lands_in_next_season(api):
    tour = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))

    assert tour.tour.season.name == str(NEXT)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert Season.objects.get(current=True).name == str(THIS)


def test_numbering_restarts_at_01_each_year(api):
    first_next = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    second_next = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))
    this_year = post_tour(api, day(THIS, '09-01'), day(THIS, '08-15'))

    assert str(first_next.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert str(second_next.tour.reference) == 'SKT-{}02'.format(NEXT % 10)
    assert str(this_year.tour.reference) == 'SKT-{}01'.format(THIS % 10)


def test_satellites_follow_the_main_event_season(api):
    """A deadline in December for a January tour belongs to the tour's season
    and carries its year digit."""
    tour = post_tour(api, day(NEXT, '01-10'), day(THIS, '12-15'), preliminary=day(THIS, '12-01'))

    assert tour.deadline.season.name == str(NEXT)
    assert tour.preliminary.season.name == str(NEXT)
    assert str(tour.deadline.reference).endswith('-{}01'.format(NEXT % 10))


def test_a_preliminary_added_later_uses_the_tour_season(api):
    tour = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))

    put(api, '/api/frontend/tours/{}/'.format(tour.pk),
        lambda body: body.update(preliminary={'startDate': day(THIS, '12-01')}))

    tour.refresh_from_db()
    assert tour.preliminary.season.name == str(NEXT)


def test_a_course_in_next_year_and_its_meetings_use_its_season(api, topic):
    course = post_course(api, topic, day(NEXT, '03-01'))

    def add_meeting(body):
        body['meetings'].append({'startDate': day(NEXT, '03-08')})
    put(api, '/api/frontend/instructions/{}/'.format(course.pk), add_meeting)

    course.refresh_from_db()
    assert course.instruction.season.name == str(NEXT)
    assert [m.season.name for m in course.meeting_list.all()] == [str(NEXT)]


def test_moving_the_start_date_to_another_year_while_in_work_rekeys_the_event(api):
    """D1: while In Arbeit or Fertig the event follows its new year -- season,
    booking code and satellites. The Reference row itself stays (it is the
    event's primary key); only its season and number change."""
    tour = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'))
    reference_pk = tour.tour.reference.pk

    def move(body):
        body['tour']['startDate'] = day(NEXT, '01-10')
    put(api, '/api/frontend/tours/{}/'.format(tour.pk), move)

    tour = Tour.objects.get(pk=tour.pk)
    assert tour.tour.season.name == str(NEXT)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert tour.tour.reference.pk == reference_pk
    assert tour.deadline.season.name == str(NEXT)
    assert str(tour.deadline.reference).endswith('-{}01'.format(NEXT % 10))


def test_moving_the_start_date_keeps_season_and_code_once_released(api):
    """D1: from Freigegeben on the code may already be printed."""
    tour = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'), state_name='Freigegeben')

    def move(body):
        body['tour']['startDate'] = day(NEXT, '01-10')
    put(api, '/api/frontend/tours/{}/'.format(tour.pk), move)

    tour = Tour.objects.get(pk=tour.pk)
    assert tour.tour.season.name == str(THIS)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(THIS % 10)


def test_codes_already_used_for_this_year_in_the_previous_season_are_skipped(api):
    """Before plan 3, events of next year were put into the current season with
    next year's digit (BGT-701 in season 2026). A new event in season 2027 must
    not hand out the same code string again."""
    legacy = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    # Put it back where the old code would have left it: current season, next year's digit.
    reference = legacy.tour.reference
    reference.season = Season.objects.get(name=str(THIS))
    reference.save()
    legacy.tour.season = reference.season
    legacy.tour.save()
    assert str(reference) == 'SKT-{}01'.format(NEXT % 10)

    new = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))

    assert new.tour.season.name == str(NEXT)
    assert str(new.tour.reference) == 'SKT-{}02'.format(NEXT % 10)
