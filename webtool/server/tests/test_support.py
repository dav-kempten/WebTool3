# -*- coding: utf-8 -*-
"""Supportanfragen aus dem Dashboard.

Der Testlauf benutzt den locmem-Backend von Django (`config/settings/test.py`
bzw. pytest-django), `mail.outbox` enthält also die verschickten Nachrichten.
"""
import pytest
from django.core import mail
from django.test import override_settings

from rest_framework.test import APIClient

URL = '/api/frontend/support/'


@pytest.fixture
def trainer(seeded):
    """Ein angemeldeter Trainer -- der übliche Absender einer Anfrage."""
    from django.contrib.auth import get_user_model

    user = get_user_model().objects.create_user(
        'wkoch', 'w.koch@example.org', 'x', first_name='Wiebke', last_name='Koch'
    )
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(user)
    return client, user


def test_a_message_goes_out_with_the_prefix(trainer):
    client, _ = trainer

    response = client.post(URL, dict(subject='Tour lässt sich nicht speichern',
                                     message='Beim Speichern kommt Fehler 500.'), format='json')

    assert response.status_code == 201
    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == '[Webtool-Support] Tour lässt sich nicht speichern'


def test_the_sender_is_named_in_the_body(trainer):
    client, _ = trainer

    client.post(URL, dict(subject='Frage', message='Worum geht es hier?'), format='json')

    body = mail.outbox[0].body
    assert 'Wiebke Koch' in body
    assert 'wkoch' in body
    assert 'w.koch@example.org' in body
    assert 'Worum geht es hier?' in body


def test_the_role_is_named_so_the_answer_can_fit_it(trainer, seeded):
    from django.contrib.auth import get_user_model

    client, _ = trainer
    client.post(URL, dict(subject='A', message='B'), format='json')
    assert 'Rolle: ohne Rolle' in mail.outbox[0].body

    staff = get_user_model().objects.create_user('gs', 'gs@example.org', 'x', is_staff=True)
    office = APIClient(HTTP_HOST='localhost')
    office.force_authenticate(staff)
    office.post(URL, dict(subject='A', message='B'), format='json')
    assert 'Rolle: Geschäftsstelle' in mail.outbox[1].body


def test_an_answer_reaches_the_sender_not_the_server(trainer):
    client, _ = trainer

    client.post(URL, dict(subject='Frage', message='Text'), format='json')

    assert mail.outbox[0].reply_to == ['w.koch@example.org']
    assert mail.outbox[0].from_email == 'django@dav-kempten.de'


@override_settings(SUPPORT_RECIPIENTS=['support@example.org', 'zweiter@example.org'])
def test_the_recipients_come_from_the_settings(trainer):
    client, _ = trainer

    client.post(URL, dict(subject='Frage', message='Text'), format='json')

    assert mail.outbox[0].to == ['support@example.org', 'zweiter@example.org']


def test_a_user_without_an_address_still_gets_through(seeded):
    """Ohne hinterlegte E-Mail gibt es keine Antwortadresse -- die Anfrage
    soll trotzdem ankommen, sonst fehlt genau die Meldung darüber."""
    from django.contrib.auth import get_user_model

    user = get_user_model().objects.create_user('ohne', '', 'x')
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(user)

    response = client.post(URL, dict(subject='Frage', message='Text'), format='json')

    assert response.status_code == 201
    assert mail.outbox[0].reply_to == []
    assert 'nicht hinterlegt' in mail.outbox[0].body


@pytest.mark.parametrize('payload', [
    dict(subject='', message='Text'),
    dict(subject='Betreff', message=''),
    dict(subject='Betreff'),
    dict(message='Text'),
])
def test_an_incomplete_request_is_rejected(trainer, payload):
    client, _ = trainer

    response = client.post(URL, payload, format='json')

    assert response.status_code == 400
    assert mail.outbox == []


def test_a_too_long_subject_is_rejected(trainer):
    client, _ = trainer

    response = client.post(URL, dict(subject='x' * 121, message='Text'), format='json')

    assert response.status_code == 400


def test_support_needs_a_login(seeded):
    response = APIClient(HTTP_HOST='localhost').post(
        URL, dict(subject='Frage', message='Text'), format='json'
    )

    assert response.status_code in (401, 403)
    assert mail.outbox == []


def test_a_broken_mail_route_is_reported_instead_of_swallowed(trainer, monkeypatch):
    """Sonst glaubt der Absender, seine Frage sei unterwegs."""
    from django.core.mail import EmailMessage

    client, _ = trainer

    def boom(self, *args, **kwargs):
        raise OSError('kein Mailserver')

    monkeypatch.setattr(EmailMessage, 'send', boom)

    response = client.post(URL, dict(subject='Frage', message='Text'), format='json')

    assert response.status_code == 502
    assert 'johannes.buettner@dav-kempten.de' in response.json()['detail']
