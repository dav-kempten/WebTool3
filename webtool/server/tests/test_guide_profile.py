# -*- coding: utf-8 -*-
"""Steckbrief-Bearbeitung unter /api/frontend/guides/<id>/."""
import json

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from server.models import Guide


def make_guide(username, first_name, last_name, season, profile=None, is_staff=False):
    user = get_user_model().objects.create_user(
        username, f'{username}@example.org', 'x',
        first_name=first_name, last_name=last_name, is_staff=is_staff,
    )
    guide = Guide.objects.create(user=user, profile=profile)
    guide.seasons.add(season)
    return guide


def auth_client(user):
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(user)
    return client


def test_empty_profile_returns_all_editable_fields_as_empty_strings(seeded):
    guide = make_guide('anna', 'Anna', 'Alpin', seeded, profile=None)
    client = auth_client(guide.user)

    response = client.get(f'/api/frontend/guides/{guide.pk}/')

    assert response.status_code == 200
    assert response.json() == {
        'id': guide.pk,
        'userName': 'anna',
        'firstName': 'Anna',
        'lastName': 'Alpin',
        'profile': {
            'name': '',
            'city': '',
            'job': '',
            'hobby': '',
            'reason': '',
            'tip': '',
        },
    }


def test_trainer_can_update_own_steckbrief_and_client_api_reads_it(seeded):
    guide = make_guide('ben', 'Ben', 'Berg', seeded, profile=None)
    client = auth_client(guide.user)

    payload = {
        'profile': {
            'name': 'Benni',
            'city': ' Kempten ',
            'job': 'Tourenleiter',
            'hobby': 'Klettern, Skitouren',
            'reason': 'Berge teilen macht Freude.',
            'tip': 'Reuterwanne am Abend',
        },
    }
    response = client.put(f'/api/frontend/guides/{guide.pk}/', payload, format='json')

    assert response.status_code == 200
    assert response.json()['profile'] == {
        'name': 'Benni',
        'city': 'Kempten',
        'job': 'Tourenleiter',
        'hobby': 'Klettern, Skitouren',
        'reason': 'Berge teilen macht Freude.',
        'tip': 'Reuterwanne am Abend',
    }

    guide.refresh_from_db()
    assert isinstance(guide.profile, str)
    assert json.loads(guide.profile) == {
        'name': 'Benni',
        'city': 'Kempten',
        'job': 'Tourenleiter',
        'hobby': 'Klettern, Skitouren',
        'reason': 'Berge teilen macht Freude.',
        'tip': 'Reuterwanne am Abend',
    }

    # Client API (Homepage) liest denselben Steckbrief fehlerfrei aus.
    anon = APIClient(HTTP_HOST='localhost')
    client_response = anon.get(f'/api/client/guides/{guide.user.username}/')
    assert client_response.status_code == 200
    assert client_response.json()['profile']['city'] == 'Kempten'
    assert client_response.json()['profile']['tip'] == 'Reuterwanne am Abend'


def test_updating_preserves_extra_keys_and_drops_cleared_fields(seeded):
    initial = json.dumps({
        'qualification': 'Naturschutzreferent',
        'city': 'Kempten',
        'tip': 'Alter Tipp',
    })
    guide = make_guide('clara', 'Clara', 'Crest', seeded, profile=initial)
    client = auth_client(guide.user)

    response = client.put(
        f'/api/frontend/guides/{guide.pk}/',
        {'profile': {'city': 'Sonthofen', 'tip': '   '}},
        format='json',
    )

    assert response.status_code == 200
    assert response.json()['profile']['city'] == 'Sonthofen'
    assert response.json()['profile']['tip'] == ''

    guide.refresh_from_db()
    stored = json.loads(guide.profile)
    assert stored == {
        'qualification': 'Naturschutzreferent',
        'city': 'Sonthofen',
    }


def test_clearing_all_fields_stores_null(seeded):
    initial = json.dumps({'city': 'Kempten'})
    guide = make_guide('dirk', 'Dirk', 'Dolomit', seeded, profile=initial)
    client = auth_client(guide.user)

    response = client.patch(
        f'/api/frontend/guides/{guide.pk}/',
        {'profile': {'city': ''}},
        format='json',
    )

    assert response.status_code == 200
    guide.refresh_from_db()
    assert guide.profile is None


def test_legacy_json_string_payload_still_accepted(seeded):
    guide = make_guide('eva', 'Eva', 'Eis', seeded, profile=None)
    client = auth_client(guide.user)

    response = client.put(
        f'/api/frontend/guides/{guide.pk}/',
        {'profile': '{"city": "Kempten", "job": "Digitale Infrastruktur"}'},
        format='json',
    )

    assert response.status_code == 200
    assert response.json()['profile']['city'] == 'Kempten'
    assert response.json()['profile']['job'] == 'Digitale Infrastruktur'


def test_permissions_enforce_own_profile_or_staff(seeded):
    anna = make_guide('anna', 'Anna', 'Alpin', seeded)
    ben = make_guide('ben', 'Ben', 'Berg', seeded)
    staff = get_user_model().objects.create_user('gs', 'gs@example.org', 'x', is_staff=True)

    # Anonym darf nicht ändern.
    anon = APIClient(HTTP_HOST='localhost')
    assert anon.put(f'/api/frontend/guides/{anna.pk}/', {'profile': {'city': 'A'}}, format='json').status_code == 403

    # Anderer Trainer darf fremden Steckbrief nicht ändern und nichts löschen.
    ben_client = auth_client(ben.user)
    assert ben_client.put(f'/api/frontend/guides/{anna.pk}/', {'profile': {'city': 'A'}}, format='json').status_code == 403
    assert ben_client.patch(f'/api/frontend/guides/{anna.pk}/', {'profile': {'city': 'A'}}, format='json').status_code == 403
    assert ben_client.delete(f'/api/frontend/guides/{ben.pk}/').status_code == 403

    # Geschäftsstelle (staff) darf fremden Steckbrief ändern.
    staff_client = auth_client(staff)
    resp = staff_client.put(f'/api/frontend/guides/{anna.pk}/', {'profile': {'city': 'Oberstdorf'}}, format='json')
    assert resp.status_code == 200
    assert resp.json()['profile']['city'] == 'Oberstdorf'


def test_validation_rejects_non_string_and_too_long_values(seeded):
    guide = make_guide('fritz', 'Fritz', 'Fels', seeded)
    client = auth_client(guide.user)

    bad_type = client.put(
        f'/api/frontend/guides/{guide.pk}/',
        {'profile': {'city': 123}},
        format='json',
    )
    assert bad_type.status_code == 400
    assert 'city' in bad_type.json()['profile']

    too_long = client.put(
        f'/api/frontend/guides/{guide.pk}/',
        {'profile': {'name': 'x' * 101}},
        format='json',
    )
    assert too_long.status_code == 400
    assert 'name' in too_long.json()['profile']


def test_list_returns_active_guides_with_job_and_has_profile(seeded):
    with_profile = make_guide(
        'greta', 'Greta', 'Gipfel', seeded,
        profile=json.dumps({'job': 'Jugendleiterin', 'city': 'Kempten'}),
    )
    empty_profile = make_guide('hans', 'Hans', 'Hang', seeded, profile=None)

    inactive = make_guide('inaktiv', 'Ina', 'Inaktiv', seeded)
    inactive.user.is_active = False
    inactive.user.save()

    deprecated = make_guide('alt', 'Alex', 'Alt', seeded)
    deprecated.deprecated = True
    deprecated.save()

    unknown = make_guide('unbekannt', 'Udo', 'Unbekannt', seeded)
    unknown.unknown = True
    unknown.save()

    staff = get_user_model().objects.create_user('gs', 'gs@example.org', 'x', is_staff=True)
    response = auth_client(staff).get('/api/frontend/guides/')

    assert response.status_code == 200
    by_id = {row['id']: row for row in response.json()}
    assert set(by_id.keys()) == {with_profile.pk, empty_profile.pk}
    assert by_id[with_profile.pk]['job'] == 'Jugendleiterin'
    assert by_id[with_profile.pk]['hasProfile'] is True
    assert by_id[empty_profile.pk]['job'] == ''
    assert by_id[empty_profile.pk]['hasProfile'] is False

