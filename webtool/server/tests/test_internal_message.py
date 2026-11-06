# -*- coding: utf-8 -*-
"""
The "Nachricht an die Geschäftsstelle" is for the office only. The frontend
API answers GET requests without a login, and so far its detail views handed
the message to anyone who knew an id. Logged-in users of the Webtool keep it.
"""
import pytest
from rest_framework.test import APIClient

from server.serializers.frontend.core import InternalFieldsMixin
from server.serializers.frontend.sessions import SessionSerializer
from server.tests.helpers import NEXT, day, post_course, post_tour, put

pytestmark = pytest.mark.django_db


@pytest.fixture
def anonymous(seeded):
    return APIClient(HTTP_HOST='localhost')


@pytest.fixture
def tour_url(api):
    tour = post_tour(api, day(NEXT, '07-10'), day(NEXT, '06-20'))
    tour.message = 'Stornofrist der Hütte: 14 Tage'
    tour.save()
    return f'/api/frontend/tours/{tour.pk}/'


@pytest.fixture
def course_url(api, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-14'))
    course.message = 'Abrechnung über Kostenstelle 4711'
    course.save()
    return f'/api/frontend/instructions/{course.pk}/'


@pytest.mark.parametrize('url', ['tour_url', 'course_url'])
def test_without_a_login_the_message_is_left_out(anonymous, url, request):
    response = anonymous.get(request.getfixturevalue(url))
    assert response.status_code == 200
    data = response.json()
    assert 'message' not in data
    assert 'comment' in data, 'the public remark stays'


@pytest.mark.parametrize('url, text', [
    ('tour_url', 'Stornofrist der Hütte: 14 Tage'),
    ('course_url', 'Abrechnung über Kostenstelle 4711'),
])
def test_the_webtool_still_shows_the_message(api, url, text, request):
    assert api.get(request.getfixturevalue(url)).json()['message'] == text


def test_the_webtool_can_still_change_the_message(api, tour_url):
    def change(body):
        body['message'] = 'Neue Absprache'

    assert put(api, tour_url, change)['message'] == 'Neue Absprache'
    assert api.get(tour_url).json()['message'] == 'Neue Absprache'


def test_group_sessions_hide_it_the_same_way():
    assert issubclass(SessionSerializer, InternalFieldsMixin)
    assert 'message' in SessionSerializer.Meta.fields
