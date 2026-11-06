# -*- coding: utf-8 -*-
"""
The trainer printout carries every field of the detail form. Each field gets a
value that occurs nowhere else, and the rendered LaTeX source must contain it,
so a field added to the form later shows up here as missing.
"""
import datetime
import shutil
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model

from server import printouts
from server.models import Category, Equipment, Guide, Topic
from server.tests.helpers import NEXT, THIS, day, post_course, post_tour, put, state

pytestmark = pytest.mark.django_db


def guide(username, first, last):
    user = get_user_model().objects.create_user(username, f'{username}@example.org', 'x', first_name=first, last_name=last)
    return Guide.objects.create(user=user)


def equipment(seeded, code, name):
    item = Equipment.objects.create(code=code, name=name)
    item.seasons.add(seeded)
    return item


def qualification(seeded, code, name):
    category = Category.objects.create(code=code, name=name, order=50, topic=True)
    category.seasons.add(seeded)
    topic = Topic.objects.create(category=category, title=name, name=name)
    topic.seasons.add(seeded)
    return topic


def contains(source, *values):
    missing = [value for value in values if printouts.tex(value) not in source]
    assert not missing, f'not in the printout: {missing}'


@pytest.fixture
def tour(api, seeded):
    tour = post_tour(api, day(NEXT, '07-10'), day(NEXT, '06-20'), preliminary=day(NEXT, '06-30'))
    event = tour.tour
    event.title, event.name = 'Kurztitel-T', 'Langtitel-T'
    event.description = 'Beschreibung-T'
    event.start_time, event.end_time = datetime.time(7, 30), datetime.time(18)
    event.end_date = datetime.date(NEXT, 7, 12)
    event.rendezvous, event.source, event.location = 'Treffpunkt-T', 'Ausgangsort-T', 'Übernachtung-T'
    event.distance = 321
    event.link, event.map = 'https://portal.example/tour', 'https://karte.example/tour'
    event.lea = event.distal = event.public_transport = event.shuttle_service = event.overnight = True
    event.save()
    preliminary = tour.preliminary
    preliminary.rendezvous = 'Vorbesprechungsort-T'
    preliminary.reservation_service = True
    preliminary.save()

    tour.info = 'Toureninfo-T'
    tour.ladies_only = tour.youth_on_tour = tour.relaxed = tour.mountain_bus = True
    tour.preconditions = 'Voraussetzung-T'
    tour.misc_equipment = 'Zusatzausrüstung-T'
    tour.equipment_service = True
    tour.min_quantity, tour.max_quantity, tour.cur_quantity = 4, 9, 7
    tour.admission, tour.extra_charges, tour.advances = Decimal('85'), Decimal('12.50'), Decimal('30')
    tour.extra_charges_info, tour.advances_info = 'Zusatzkosten-T', 'Anzahlung-T'
    tour.kv_link = 'https://kv.example/tour'
    tour.comment, tour.message = 'Bemerkung-T', 'Nachricht-T'
    tour.guide = guide('leitung', 'Lea', 'Leitner')
    tour.state = state('Fertig')
    tour.save()
    tour.team.add(guide('team', 'Toni', 'Teamer'))
    tour.equipments.add(equipment(seeded, 'EQT', 'Ausrüstungsstück-T'))
    tour.qualifications.add(qualification(seeded, 'QLT', 'Qualifikation-T'))
    extra = Category.objects.exclude(pk=event.reference.category.pk).filter(seasons=seeded).first()
    tour.categories.add(extra)
    tour.extra = extra
    return tour


def test_tour_printout_shows_every_form_field(tour):
    source = printouts.tour_source(tour)
    event = tour.tour

    contains(
        source,
        # Buchungsnummer, Status, Tourenart
        str(event.reference), 'Fertig', event.reference.category.name,
        # Organisation und Team
        'Lea Leitner', 'Toni Teamer',
        # Tourenspezifika and Zusatzkategorien
        'Touren von Frauen für Frauen', 'Jugend on Tour', "Geh'mütlich", 'Bergbus', 'Übernachtungstour',
        tour.extra.name,
        # Tour-Termine: tour, deadline, preliminary with its place, info
        f'{NEXT}, 7.30 bis 18 Uhr', '20. Juni', '30. Juni', 'Vorbesprechungsort-T', 'Toureninfo-T',
        # Technik & Kondition
        tour.skill.code, tour.fitness.code,
        # Anforderungen und Ausrüstung
        'Qualifikation-T', 'Voraussetzung-T', 'Ausrüstungsstück-T', 'Zusatzausrüstung-T',
        # Teilnehmer*innen (current count in the internal block)
        'mindestens 4, maximal 9', 'Anmeldungen beim Ausdruck',
        # Kosten
        'Zusatzkosten-T', 'Anzahlung-T',
        # KV, Bemerkungen, Nachricht, Ausrüstungsbedarf
        'Bemerkung-T', 'Nachricht-T', 'Ausrüstungsbedarf Tour',
        # Termin-Details of the tour itself
        'Langtitel-T', 'Beschreibung-T', 'Treffpunkt-T', 'Ausgangsort-T', 'Übernachtung-T', 'ca. 321 km',
        'Low Emission Adventure', 'Gemeinschaftsanreise', 'Öffentliche Anreise', 'Alpin-Shuttle', 'Seminarraum',
    )
    assert '\\davTitle{KURZTITEL-T}' in source
    for url in ('https://portal.example/tour', 'https://karte.example/tour', 'https://kv.example/tour'):
        assert f'\\url{{{url}}}' in source
    for money in ('\\EUR{85}', '\\EUR{12,50}', '\\EUR{30}'):
        assert money in source


@pytest.fixture
def course(api, seeded, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-14'))
    url = f'/api/frontend/instructions/{course.pk}/'

    def add_meeting(body):
        body['meetings'].append({
            'startDate': day(NEXT, '03-21'), 'startTime': '09:00', 'endTime': '16:00',
            'title': 'Praxistag-K', 'name': 'Langtitel-Termin-K',
            'rendezvous': 'Treffpunkt-Termin-K', 'source': 'Kursort-Termin-K', 'location': 'Hütte-Termin-K',
            'shuttleService': True,
        })
    put(api, url, add_meeting)
    course.refresh_from_db()

    course_topic.preconditions = 'Thema-Voraussetzung-K'
    course_topic.misc_equipment = 'Thema-Zusatzausrüstung-K'
    course_topic.description = 'Thema-Beschreibung-K'
    course_topic.save()
    course_topic.qualifications.add(qualification(seeded, 'QTK', 'Thema-Qualifikation-K'))
    course_topic.equipments.add(equipment(seeded, 'EQK', 'Thema-Ausrüstung-K'))

    event = course.instruction
    event.description = 'Ergänzung-K'
    event.rendezvous, event.source, event.location = 'Treffpunkt-K', 'Kursort-K', 'Übernachtung-K'
    event.distance = 123
    event.lea = event.distal = event.public_transport = event.overnight = True
    event.reservation_service = True
    event.save()

    course.ladies_only = True
    course.preconditions = 'Voraussetzung-K'
    course.misc_equipment = 'Zusatzausrüstung-K'
    course.equipment_service = True
    course.min_quantity, course.max_quantity = 3, 8
    course.admission, course.extra_charges, course.advances = Decimal('140'), Decimal('20'), Decimal('50')
    course.extra_charges_info, course.advances_info = 'Zusatzkosten-K', 'Anzahlung-K'
    course.kv_link = 'https://kv.example/kurs'
    course.comment, course.message = 'Bemerkung-K', 'Nachricht-K'
    course.guide = guide('kursleitung', 'Karla', 'Kursleiter')
    course.category = Category.objects.filter(seasons=seeded).exclude(pk=course_topic.category.pk).first()
    course.save()
    course.team.add(guide('kursteam', 'Kai', 'Kursteam'))
    course.equipments.add(equipment(seeded, 'EQX', 'Ausrüstungsstück-K'))
    course.qualifications.add(qualification(seeded, 'QLK', 'Qualifikation-K'))
    return course


def test_course_printout_shows_every_form_field(course):
    source = printouts.instruction_source(course)
    topic = course.topic

    contains(
        source,
        # Buchungsnummer, Status, Thema
        str(course.instruction.reference), course.state.name, topic.name,
        # Organisation und Team
        'Karla Kursleiter', 'Kai Kursteam',
        # Kursspezifika and Zusatzkategorie
        'Kurs von Frauen für Frauen', 'Kurs mit Übernachtung', course.category.name,
        # Kurs-Termine: main event and the added meeting with its places
        '14. März', '21. März', '9 bis 16 Uhr', 'Praxistag-K', 'Langtitel-Termin-K',
        'Treffpunkt-Termin-K', 'Kursort-Termin-K', 'Hütte-Termin-K',
        # Kursdetails aus dem Kursthema
        'Thema-Beschreibung-K', 'Thema-Qualifikation-K', 'Thema-Voraussetzung-K',
        'Thema-Ausrüstung-K', 'Thema-Zusatzausrüstung-K',
        # Anforderungen und Ausrüstung
        'Qualifikation-K', 'Voraussetzung-K', 'Ausrüstungsstück-K', 'Zusatzausrüstung-K',
        # Teilnehmer*innen and Kosten
        'mindestens 3, maximal 8', 'Zusatzkosten-K', 'Anzahlung-K',
        # Bemerkungen, Nachricht, Ausrüstungsbedarf, reservations
        'Bemerkung-K', 'Nachricht-K', 'Ausrüstungsbedarf Kurs', 'Seminarraum', 'Alpin-Shuttle',
        # Termin-Details of the main event
        'Ergänzung-K', 'Treffpunkt-K', 'Kursort-K', 'Übernachtung-K', 'ca. 123 km',
        'Low Emission Adventure', 'Gemeinschaftsanreise', 'Öffentliche Anreise',
    )
    assert '\\url{https://kv.example/kurs}' in source
    for money in ('\\EUR{140}', '\\EUR{20}', '\\EUR{50}'):
        assert money in source


def test_empty_fields_leave_no_empty_section(api, seeded):
    tour = post_tour(api, day(NEXT, '07-10'), day(NEXT, '06-20'))
    source = printouts.tour_source(tour)
    assert 'Organisation und Team'.upper() not in source.upper()
    assert 'Bemerkungen' not in source


def test_unsettable_characters_are_dropped_but_levels_stay():
    assert printouts.tex('Grat △△ ✓ 50%') == 'Grat △△  50\\%'


@pytest.mark.skipif(shutil.which('pdflatex') is None, reason='needs TeX Live (pdflatex)')
def test_hyphenated_title_is_printed_whole(tour):
    import subprocess
    import tempfile

    tour.tour.title = 'Ski-Hochtour'
    pdf = printouts.render_pdf(printouts.document(printouts.tour_source(tour)))
    with tempfile.NamedTemporaryFile(suffix='.pdf') as f:
        f.write(pdf)
        f.flush()
        if shutil.which('pdftotext') is None:
            pytest.skip('needs poppler (pdftotext)')
        text = subprocess.run(['pdftotext', f.name, '-'], capture_output=True, text=True).stdout
    assert 'SKI-HOCHTOUR' in text


@pytest.mark.skipif(shutil.which('pdflatex') is None, reason='needs TeX Live (pdflatex)')
@pytest.mark.parametrize('kind', ['tours', 'instructions'])
def test_printout_endpoint_returns_a_pdf(api, kind, request):
    item = request.getfixturevalue('tour' if kind == 'tours' else 'course')
    # The header the frontend sends; without a PDF renderer DRF answered 406.
    response = api.get(f'/api/frontend/{kind}/{item.pk}/printout/', HTTP_ACCEPT='application/pdf')
    assert response.status_code == 200, response.content[:200]
    assert response['Content-Type'] == 'application/pdf'
    assert response.content.startswith(b'%PDF')
    assert 'attachment; filename="' in response['Content-Disposition']


@pytest.mark.parametrize('accept', ['application/pdf', 'application/json, text/plain, */*'])
def test_printout_needs_a_login(api, tour, accept):
    api.force_authenticate(None)
    response = api.get(f'/api/frontend/tours/{tour.pk}/printout/', HTTP_ACCEPT=accept)
    assert response.status_code in (401, 403)


def test_unknown_tour_is_a_404_also_for_pdf_requests(api, seeded):
    response = api.get('/api/frontend/tours/999999/printout/', HTTP_ACCEPT='application/pdf')
    assert response.status_code == 404
