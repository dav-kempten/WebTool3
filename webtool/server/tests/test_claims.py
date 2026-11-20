# -*- coding: utf-8 -*-
"""
Abrechnung (server/claims.py): die Sätze aus Abrechnungsleitfaden und
Formular, die Vorbelegung aus Tour und Kurs, die IBAN-Prüfung, und wer
abrechnen darf.
"""
import datetime
import shutil
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from server import claims
from server.models import Guide, Qualification, QualificationGroup, UserQualification
from server.tests.helpers import NEXT, day, post_course, post_tour, put

pytestmark = pytest.mark.django_db


def compute(kind, level=1, **data):
    return claims.compute(dict(kind=kind, level=level, **data))


def days(*hours, kind='day'):
    return [dict(date=datetime.date(NEXT, 7, 10 + i), hours=Decimal(h), kind=kind) for i, h in enumerate(hours)]


def rows(part):
    return [(r.label, r.rate, r.quantity, r.amount) for r in part]


# --- Sätze --------------------------------------------------------------------

def test_tour_days_are_counted_per_category():
    claim = compute('tour', days=days('5.75', '6', '10'))
    assert claim.day_amounts == [Decimal('25.00'), Decimal('40.00'), Decimal('40.00')]
    assert rows(claim.compensation) == [
        ('Tour ab 6 Std.', '40 €', '2', Decimal('80.00')),
        ('Tour bis 6 Std.', '25 €', '1', Decimal('25.00')),
    ]


@pytest.mark.parametrize('level, hourly, short, long', [(1, 7, 20, 35), (2, 9, 30, 55), (3, 11, 40, 70), (4, 13, 50, 85)])
def test_course_rates_per_category(level, hourly, short, long):
    claim = compute('course', level=level, days=days('2.5', '3', '4', '6', '9'))
    assert claim.day_amounts == [
        Decimal(hourly) * Decimal('2.5'), Decimal(hourly) * 3, Decimal(short), Decimal(long), Decimal(long),
    ]
    roman = claims.LEVEL_ROMAN[level]
    assert [(r.label, r.quantity) for r in claim.compensation] == [
        (f'Kat. {roman} ab 6 Std.', '2'), (f'Kat. {roman} bis 6 Std.', '1'), (f'Kat. {roman} bis 3 Std.', '5,5 Std.'),
    ]
    assert claims.Claim.sum(claim.compensation) == sum(claim.day_amounts)


def test_course_preliminary_meeting_is_ten_euros_flat():
    claim = compute('course', level=4, days=days('2', '1.5', kind='preliminary'))
    assert rows(claim.compensation) == [('Vorbesprechung', '10 €', '2', Decimal('20.00'))]


def test_nights_flat_or_by_receipt_up_to_fifty():
    claim = compute('tour', nights=[dict(receipt=None), dict(receipt=Decimal('38.50')), dict(receipt=Decimal('72'))])
    assert claim.night_amounts == [Decimal('25.00'), Decimal('38.50'), Decimal('50.00')]
    assert rows(claim.compensation) == [
        ('Nacht lt. Beleg', '38,50 €', '1', Decimal('38.50')),
        ('Nacht lt. Beleg', '72 €, max. 50 €', '1', Decimal('50.00')),
        ('Nacht pauschal', '25 €', '1', Decimal('25.00')),
    ]


def test_travel_by_car_bike_as_passenger_and_train():
    claim = compute('tour', carKm=245, bikeKm=40, passengerKm=100, publicTransport=Decimal('30'), bahncard='bc50')
    assert rows(claim.travel) == [
        ('PKW', '0,20 €/km', '245 km', Decimal('49.00')),
        ('Fahrrad', '0,15 €/km', '40 km', Decimal('6.00')),
        ('Leiter als Mitfahrer', '0,07 €/km', '100 km', Decimal('7.00')),
        ('Bahn/ÖPNV nach Beleg mit BahnCard 50 × 110 %', '30 €', '1', Decimal('33.00')),
    ]


def test_total_adds_all_parts():
    claim = compute(
        'tour', days=days('9', '9'), nights=[dict(receipt=None)], carKm=100,
        expenses=[dict(label='Maut', amount=Decimal('9.60')), dict(label='', amount=Decimal('0'))],
    )
    assert len(claim.expenses) == 1
    assert claim.total == Decimal('40') * 2 + Decimal('25') + Decimal('20') + Decimal('9.60')


@pytest.mark.parametrize('code, group, level', [
    ('TBH', 'Trainer', 4), ('TCSP', 'Trainer', 3), ('BSF', 'Berufsausbildungen', 4),
    ('HT', 'Fachübungsleiter', 3), ('JL', 'Leiter', 2), ('KB', 'Leiter', 2),
    ('AW', 'Weitere', 1), ('', None, 1),
])
def test_qualification_levels(code, group, level):
    assert claims.qualification_level(code, group) == level


@pytest.mark.parametrize('iban, valid', [
    ('DE02 1203 0000 0000 2020 51', True),
    ('de02120300000000202051', True),
    ('AT61 1904 3002 3457 3201', True),
    ('DE02 1203 0000 0000 2020 52', False),  # Prüfziffer
    ('DE02 1203 0000 0000 2020 5', False),  # Länge
    ('Kein Konto', False),
])
def test_iban_check(iban, valid):
    assert claims.iban_valid(iban) is valid


# --- Vorbelegung und Schnittstelle ----------------------------------------------

def make_guide(username, is_staff=False):
    user = get_user_model().objects.create_user(
        username, f'{username}@example.org', 'x', first_name=username.title(), last_name='Muster', is_staff=is_staff,
    )
    return Guide.objects.create(user=user, mobile='0170 1234567')


def client_for(guide):
    client = APIClient(HTTP_HOST='localhost')
    client.force_authenticate(guide.user)
    return client


def qualify(guide, code, group_name):
    group, _ = QualificationGroup.objects.get_or_create(name=group_name)
    qualification, _ = Qualification.objects.get_or_create(code=code, defaults=dict(name=code, group=group))
    UserQualification.objects.create(user=guide.user, qualification=qualification, year=2020)


@pytest.fixture
def tour(api, seeded):
    tour = post_tour(api, day(NEXT, '07-10'), day(NEXT, '06-20'))
    event = tour.tour
    event.start_time, event.end_time = datetime.time(7), datetime.time(17, 30)
    event.distance = 180
    event.source = 'Oberstdorf'
    event.save()
    tour.guide = make_guide('leiter')
    tour.save()
    tour.team.add(make_guide('helfer'))
    return tour


@pytest.fixture
def course(api, seeded, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-14'))

    def add_meeting(body):
        body['meetings'].append({
            'startDate': day(NEXT, '03-21'), 'endDate': day(NEXT, '03-22'),
            'startTime': '08:00', 'title': 'Praxis',
        })
    put(api, f'/api/frontend/instructions/{course.pk}/', add_meeting)
    course.refresh_from_db()
    event = course.instruction
    event.start_time, event.end_time = datetime.time(19), datetime.time(21, 30)
    event.save()
    course.guide = make_guide('trainerin')
    course.save()
    qualify(course.guide, 'TBSHT', 'Trainer')
    return course


def test_tour_defaults(tour):
    data = client_for(tour.guide).get(f'/api/frontend/tours/{tour.pk}/claim/').json()
    assert data['kind'] == 'tour'
    assert data['trainerId'] == tour.guide.pk
    assert [t['name'] for t in data['trainers']] == ['Leiter Muster', 'Helfer Muster']
    assert data['days'] == [dict(date=f'{NEXT}-07-10', hours='10.50', kind='day', estimated=False)]
    assert data['carKm'] == 180
    assert data['phone'] == '0170 1234567'
    assert data['place'] == 'Oberstdorf'
    assert data['leaders'] == 2
    assert data['begin'] == f'10.7.{NEXT}, 7.00 Uhr'
    assert data['end'] == f'10.7.{NEXT}, 17.30 Uhr'
    assert data['nights'] == []


def test_shuttle_tour_starts_without_car_kilometres(tour):
    event = tour.tour
    event.shuttle_service = True
    event.save()
    data = client_for(tour.guide).get(f'/api/frontend/tours/{tour.pk}/claim/').json()
    assert (data['carKm'], data['shuttle']) == (0, True)


def test_team_member_is_preselected(tour):
    helper = tour.team.first()
    assert client_for(helper).get(f'/api/frontend/tours/{tour.pk}/claim/').json()['trainerId'] == helper.pk


def test_course_defaults_list_every_day_and_the_level(course):
    data = client_for(course.guide).get(f'/api/frontend/instructions/{course.pk}/claim/').json()
    assert data['level'] == 4
    assert [(d['date'], d['hours'], d['estimated']) for d in data['days']] == [
        (f'{NEXT}-03-14', '2.50', False),
        (f'{NEXT}-03-21', '8', True),
        (f'{NEXT}-03-22', '8', True),
    ]
    assert len(data['nights']) == 1


def test_course_spanning_its_meetings_counts_only_the_meetings(course):
    """Haupttermin 14.3. bis 22.3. umspannt den Kurstermin: nur dessen Tage zählen."""
    event = course.instruction
    event.end_date = datetime.date(NEXT, 3, 22)
    event.save()
    data = client_for(course.guide).get(f'/api/frontend/instructions/{course.pk}/claim/').json()
    assert [d['date'] for d in data['days']] == [f'{NEXT}-03-21', f'{NEXT}-03-22']
    assert len(data['nights']) == 1


def test_preview_computes_the_corrected_claim(course):
    body = {
        'trainerId': course.guide.pk, 'level': 4, 'carKm': 90, 'passengerKm': 50,
        'days': [{'date': f'{NEXT}-03-14', 'hours': '2.5'}, {'date': f'{NEXT}-03-21', 'hours': '7'}],
        'nights': [{'receipt': '42'}],
        'expenses': [{'label': 'Liftkarte', 'amount': '38'}],
    }
    data = client_for(course.guide).post(f'/api/frontend/instructions/{course.pk}/claim/', body, format='json').json()
    assert data['dayAmounts'] == ['32.50', '85.00']
    assert data['nightAmounts'] == ['42.00']
    assert Decimal(data['total']) == Decimal('32.50') + 85 + 42 + Decimal('18.00') + Decimal('3.50') + 38


def test_invalid_iban_is_rejected_and_a_valid_one_formatted(course):
    url = f'/api/frontend/instructions/{course.pk}/claim/'
    client = client_for(course.guide)
    response = client.post(url, {'trainerId': course.guide.pk, 'iban': 'DE02120300000000202052'}, format='json')
    assert response.status_code == 400
    assert 'iban' in response.json()
    serializer = claims.ClaimInputSerializer(data={'iban': 'de02120300000000202051'})
    assert serializer.is_valid()
    assert serializer.validated_data['iban'] == 'DE02 1203 0000 0000 2020 51'


def test_others_may_not_claim(tour):
    stranger = make_guide('fremd')
    assert client_for(stranger).get(f'/api/frontend/tours/{tour.pk}/claim/').status_code == 403


def test_trainers_claim_only_for_themselves(tour):
    helper = tour.team.first()
    response = client_for(helper).post(
        f'/api/frontend/tours/{tour.pk}/claim/', {'trainerId': tour.guide.pk}, format='json',
    )
    assert response.status_code == 403


def test_office_may_claim_for_any_trainer(tour):
    office = make_guide('office', is_staff=True)
    response = client_for(office).post(
        f'/api/frontend/tours/{tour.pk}/claim/', {'trainerId': tour.guide.pk, 'days': []}, format='json',
    )
    assert response.status_code == 200


def test_unknown_trainer_is_rejected(tour):
    office = make_guide('office', is_staff=True)
    response = client_for(office).post(
        f'/api/frontend/tours/{tour.pk}/claim/', {'trainerId': make_guide('fremd').pk}, format='json',
    )
    assert response.status_code == 400


def claim_input(course, **changes):
    data = dict(
        trainerId=course.guide.pk, name='Trainerin Muster', address='Weg 1\n87435 Kempten', phone='', memberId='',
        qualification='TB Skihochtouren', country='', iban='', bank='', level=4,
        days=days('2.5'), nights=[dict(receipt=None)], carKm=50, bikeKm=0, passengerKm=20,
        publicTransport=None, bahncard='none', travelFrom='Kempten', travelTo='Oberstdorf',
        expenses=[dict(label='Parken & Maut', amount=Decimal('7'))], participants=8,
        invoiceDate=datetime.date(NEXT, 4, 1), note='',
    )
    data.update(changes)
    return data


def test_pdf_source_follows_the_form(course):
    data = claim_input(course)
    claim = claims.compute(dict(data, kind='course'))
    info = claims.defaults(course, 'course', course.guide.user)
    source = claims.claim_document(claims.claim_source(course, 'course', data, claim, info), course.instruction.reference)
    for text in ('Kurs, Kategorie IV (TB, BGF)', 'Trainerin Muster', 'Weg 1, 87435 Kempten', '\\claimBlank',
                 'Kat. IV bis 3 Std.', 'Leiter als Mitfahrer', 'Kempten – Oberstdorf', 'Parken \\& Maut',
                 '32,50 €', 'lt. Mitgliederverwaltung', '3.300 €', '\\claimSignature', str(course.instruction.reference)):
        assert text in source, text


def test_pdf_source_prints_a_given_iban_instead_of_the_blank(course):
    data = claim_input(course, iban='DE02 1203 0000 0000 2020 51', bank='Sparkasse Allgäu')
    claim = claims.compute(dict(data, kind='course'))
    info = claims.defaults(course, 'course', course.guide.user)
    source = claims.claim_source(course, 'course', data, claim, info)
    assert 'IBAN: DE02 1203 0000 0000 2020 51' in source
    assert 'Mitgliederverwaltung' not in source


@pytest.mark.skipif(shutil.which('pdflatex') is None, reason='needs TeX Live (pdflatex)')
def test_claim_endpoint_returns_a_pdf(course):
    body = {'trainerId': course.guide.pk, 'level': 4, 'days': [{'date': f'{NEXT}-03-14', 'hours': '2.5'}]}
    response = client_for(course.guide).post(
        f'/api/frontend/instructions/{course.pk}/claim/', body, format='json', HTTP_ACCEPT='application/pdf',
    )
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/pdf'
    assert response.content.startswith(b'%PDF')
