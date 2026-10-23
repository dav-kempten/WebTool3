# -*- coding: utf-8 -*-
"""Helpers for tests that create real tours and courses through the frontend API.

They go with the `seeded`, `api` and `course_topic` fixtures in conftest.py:
init_season seeds a current season with categories, states, skills and
fitness, which the fixture renames to the real current year.
"""
import datetime

from server.models import Category, Instruction, Season, State, Tour

THIS = datetime.date.today().year
NEXT = THIS + 1
LAST = THIS - 1


def day(year, month_day):
    return "{}-{}".format(year, month_day)


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


def post_course(api, topic, start, state_name='In Arbeit'):
    body = {
        'topicId': topic.pk,
        'instruction': {'startDate': start},
        'guideId': None,
        'stateId': state(state_name).pk,
        'isSpecial': False,
    }
    response = api.post('/api/frontend/instructions/', body, format='json')
    assert response.status_code == 201, response.content
    return Instruction.objects.get(pk=response.json()['id'])


def put(api, url, change):
    body = api.get(url).json()
    change(body)
    response = api.put(url, body, format='json')
    assert response.status_code == 200, response.content
    return response.json()
