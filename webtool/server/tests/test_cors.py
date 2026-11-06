# -*- coding: utf-8 -*-
"""
The homepage calls /api/client/ from www.dav-kempten.de. With the wildcard
entries the production settings had, django-cors-headers allowed no subdomain
at all and every preflight from the homepage was rejected.
"""
import pytest
from django.test import override_settings

from config.settings import cors

CORS = {name: getattr(cors, name) for name in dir(cors) if name.startswith('CORS_')}

PREFLIGHT = {
    'HTTP_ACCESS_CONTROL_REQUEST_METHOD': 'POST',
    'HTTP_ACCESS_CONTROL_REQUEST_HEADERS': 'content-type',
}


def preflight(client, origin, path='/api/client/booklets/'):
    return client.options(path, HTTP_ORIGIN=origin, **PREFLIGHT)


@override_settings(**CORS)
@pytest.mark.parametrize('origin', [
    'https://www.dav-kempten.de',
    'https://dav-kempten.de',
    'https://intern.dav-kempten.de',
    'https://www.dav-kempten-neue-homepage.de',
])
def test_homepage_origins_pass_the_preflight(client, origin):
    response = preflight(client, origin)
    assert response.headers.get('Access-Control-Allow-Origin') == origin
    assert 'POST' in response.headers.get('Access-Control-Allow-Methods', '')


@override_settings(**CORS)
@pytest.mark.parametrize('origin', [
    'https://evil-dav-kempten.de',
    'https://dav-kempten.de.evil.com',
    'http://www.dav-kempten.de',
    'https://example.com',
])
def test_other_origins_are_refused(client, origin):
    assert 'Access-Control-Allow-Origin' not in preflight(client, origin).headers


@override_settings(**CORS)
@pytest.mark.django_db
def test_only_the_api_answers_cross_origin(client):
    response = client.get('/admin/login/', HTTP_ORIGIN='https://www.dav-kempten.de')
    assert 'Access-Control-Allow-Origin' not in response.headers
