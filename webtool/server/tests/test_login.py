# -*- coding: utf-8 -*-
"""Anmeldung: Trainer mit Mitgliedsnummer, Personal nur mit Benutzername und Passwort."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from server.models import Profile

pytestmark = pytest.mark.django_db

URL = '/api/login/'


def make_user(username, member_id=None, **flags):
    user = get_user_model().objects.create_user(username, f'{username}@example.org', 'geheim', **flags)
    if member_id:
        Profile.objects.create(user=user, member_id=member_id)
    return user


def login(**body):
    client = APIClient(HTTP_HOST='localhost')
    return client, client.post(URL, body, format='json')


def test_a_trainer_logs_in_with_the_member_id():
    user = make_user('trainer', '008-00-111111')
    client, response = login(member_id='008-00-111111')
    assert response.status_code == 200, response.content
    assert response.json()['id'] == user.pk
    assert client.get(URL).json()['id'] == user.pk


@pytest.mark.parametrize('flags', [{'is_staff': True}, {'is_superuser': True, 'is_staff': True}])
def test_staff_cannot_log_in_with_the_member_id(flags):
    make_user('buero', '008-00-222222', **flags)
    client, response = login(member_id='008-00-222222')
    assert response.status_code == 400, response.content
    assert client.get(URL).json() == {}


def test_staff_logs_in_with_name_and_password():
    user = make_user('buero', '008-00-222222', is_staff=True)
    _, response = login(username='buero', password='geheim')
    assert response.status_code == 200, response.content
    assert response.json()['role'] == 'staff'
    assert response.json()['id'] == user.pk


def test_a_wrong_password_is_refused():
    make_user('buero', is_staff=True)
    _, response = login(username='buero', password='falsch')
    assert response.status_code == 400, response.content


@pytest.mark.parametrize('member_id', ['', '   ', '008-00-999999'])
def test_an_empty_or_unknown_member_id_is_refused(member_id):
    make_user('trainer', '008-00-111111')
    _, response = login(member_id=member_id)
    assert response.status_code == 400, response.content


def test_an_inactive_trainer_is_refused():
    make_user('trainer', '008-00-111111', is_active=False)
    _, response = login(member_id='008-00-111111')
    assert response.status_code == 400, response.content
