# -*- coding: utf-8 -*-
"""
Auf der Homepage stehen Treffpunkt, Kursort und Übernachtung eines Kurses
beschriftet: beim Haupttermin je in einer eigenen Zeile unter "Termin:" bzw.
"Abfahrt:", bei den weiteren Terminen im Fließtext der Terminzeile.
"""
import datetime

import pytest

from server.tests.helpers import NEXT, day, post_course, put

pytestmark = pytest.mark.django_db


@pytest.fixture
def course(api, seeded, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-14'))

    def add_meeting(body):
        body['meetings'].append({
            'startDate': day(NEXT, '03-21'), 'startTime': '09:00', 'endTime': '16:00',
            'title': 'Praxistag', 'name': 'Praxis am Fels',
            'rendezvous': 'Alpinzentrum Kempten, Parkplatz', 'source': 'Klettergarten',
            'location': 'Kemptner Hütte',
        })
    put(api, f'/api/frontend/instructions/{course.pk}/', add_meeting)
    course.refresh_from_db()

    event = course.instruction
    event.start_time, event.end_time = datetime.time(18), datetime.time(21)
    event.rendezvous = 'Alpinzentrum Kempten, Seminarraum'
    event.source = 'Kletterhalle'
    event.location = 'Otto-Mayr-Hütte'
    event.save()
    return course


def main_block(details):
    """Der Absatz mit dem Haupttermin, aufgeteilt in seine Zeilen."""
    start = details.index('<p><strong>Termin:') if '<strong>Termin:' in details else details.index('<p><strong>Abfahrt:')
    return details[start + 3:details.index('</p>', start)].split('<br />')


def test_main_appointment_lists_places_on_own_lines(course):
    lines = main_block(course.details())
    assert lines[0].startswith('<strong>Termin:</strong> 14.3.')
    assert 'Seminarraum' not in lines[0] and 'Otto-Mayr-Hütte' not in lines[0]
    assert lines[1:] == [
        '<strong>Treffpunkt:</strong> Alpinzentrum Kempten, Seminarraum',
        '<strong>Kursort:</strong> Kletterhalle',
        '<strong>Übernachtung:</strong> Otto-Mayr-Hütte',
    ]


def test_distal_main_appointment_keeps_rendezvous_out_of_departure(course):
    course.instruction.distal = True
    course.instruction.save()
    lines = main_block(course.details())
    assert lines[0].startswith('<strong>Abfahrt:</strong> 14.3.')
    assert 'Seminarraum' not in lines[0]
    assert '<strong>Treffpunkt:</strong> Alpinzentrum Kempten, Seminarraum' in lines
    assert '<strong>Übernachtung:</strong> Otto-Mayr-Hütte' in lines


def test_further_appointments_label_places_inline(course):
    assert (
        '21.3., 9 bis 16 Uhr, Praxis am Fels, Treffpunkt: Alpinzentrum Kempten, Parkplatz, '
        'Kursort: Klettergarten, Übernachtung: Kemptner Hütte'
    ) in course.details()


def test_empty_places_are_left_out(course):
    event = course.instruction
    event.source = event.location = ''
    event.save()
    lines = main_block(course.details())
    assert lines[1:] == ['<strong>Treffpunkt:</strong> Alpinzentrum Kempten, Seminarraum']


def test_appointment_keeps_places_for_other_callers(course):
    """Das Programmheft nutzt appointment() und departure() weiter mit Orten."""
    event = course.instruction
    assert event.appointment().endswith('Otto-Mayr-Hütte, Alpinzentrum Kempten, Seminarraum')
    assert 'Alpinzentrum Kempten, Seminarraum' in event.departure()


def test_places_are_escaped(course):
    meeting = course.meeting_list.first()
    meeting.rendezvous = 'Hütte <b>Alpenrose</b> & Co'
    meeting.save()
    event = course.instruction
    event.location = '<script>x()</script>'
    event.save()
    details = course.details()
    assert 'Treffpunkt: Hütte &lt;b&gt;Alpenrose&lt;/b&gt; &amp; Co' in details
    assert '<strong>Übernachtung:</strong> &lt;script&gt;x()&lt;/script&gt;' in details
    assert '<script>' not in details


def test_labels_typed_into_the_fields_are_not_doubled(course):
    event = course.instruction
    event.rendezvous = 'Treffpunkt: Alpinzentrum Kempten, Seminarraum'
    event.source = 'Ausgangspunkt: Kletterhalle'
    event.location = 'Übernachtung: Otto-Mayr-Hütte'
    event.save()
    meeting = course.meeting_list.first()
    meeting.rendezvous = 'treffpunkt : Alpinzentrum Kempten, Parkplatz'
    meeting.save()
    lines = main_block(course.details())
    assert lines[1:] == [
        '<strong>Treffpunkt:</strong> Alpinzentrum Kempten, Seminarraum',
        '<strong>Kursort:</strong> Kletterhalle',
        '<strong>Übernachtung:</strong> Otto-Mayr-Hütte',
    ]
    assert 'Praxis am Fels, Treffpunkt: Alpinzentrum Kempten, Parkplatz, Kursort' in course.details()
