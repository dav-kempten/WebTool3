# -*- coding: utf-8 -*-
"""
Der Homepage-Text einer Tour (Tour.details()): Aufbau, Bezeichnungen, Kosten,
und dass Formulareingaben escapt bzw. auf die erlaubten Tags gefiltert werden.
"""
import datetime
from decimal import Decimal

import pytest

from server.models import homepage
from server.tests.helpers import NEXT, day, post_tour

pytestmark = pytest.mark.django_db


@pytest.fixture
def tour(api, seeded):
    tour = post_tour(api, day(NEXT, '07-10'), day(NEXT, '06-20'), preliminary=day(NEXT, '06-30'))
    event = tour.tour
    event.name = 'Überschreitung der Trettachspitze'
    event.description = 'Lange Tour.<br />Mit <b>Kletterstellen</b> im II. Grad.'
    event.start_time, event.end_time = datetime.time(6), datetime.time(19)
    event.rendezvous = 'Alpinzentrum Kempten, Parkplatz'
    event.source = 'Birgsau'
    event.location = 'Mindelheimer Hütte'
    event.distance = 100
    event.save()
    preliminary = tour.preliminary
    preliminary.start_time = datetime.time(19)
    preliminary.rendezvous = 'Alpinzentrum Kempten, Seminarraum'
    preliminary.save()
    tour.min_quantity, tour.max_quantity = 3, 6
    tour.save()
    return tour


def paragraphs(details):
    return [part.split('</p>')[0] for part in details.split('<p>')[1:]]


def places_paragraph(details):
    return next(p for p in paragraphs(details) if '<strong>Abfahrt:</strong>' in p).split('<br />')


def costs_paragraph(details):
    return next(p for p in paragraphs(details) if 'Teilnahmegebühr' in p).split('<br />')


def test_title_and_description(tour):
    details = tour.details()
    assert details.startswith('<h3>Überschreitung der Trettachspitze</h3>')
    assert '<p>Lange Tour.<br>Mit <b>Kletterstellen</b> im II. Grad.</p>' in details


def test_meeting_and_places_are_labelled(tour):
    lines = places_paragraph(tour.details())
    assert lines[0].startswith('<strong>Vorbesprechung:</strong> ')
    assert lines[0].endswith('19 Uhr, Alpinzentrum Kempten, Seminarraum')
    assert lines[1].startswith('<strong>Abfahrt:</strong> ')
    assert 'Alpinzentrum Kempten, Parkplatz, Heimkehr' in lines[1]
    assert lines[2:] == [
        '<strong>Ausgangspunkt:</strong> Birgsau',
        '<strong>Übernachtung:</strong> Mindelheimer Hütte',
    ]


def test_info_replaces_missing_preliminary(tour):
    tour.preliminary.delete()
    tour.refresh_from_db()
    tour.info = 'Infos per Mail'
    tour.save()
    assert places_paragraph(tour.details())[0] == '<strong>Toureninformation:</strong> Infos per Mail'


def test_removed_preliminary_is_not_shown(tour):
    # Removing the preliminary in the frontend only marks the event deprecated.
    tour.preliminary.deprecated = True
    tour.preliminary.save()
    tour.info = 'Infos per Mail'
    tour.save()
    details = tour.details()
    assert 'Vorbesprechung' not in details
    assert places_paragraph(details)[0] == '<strong>Toureninformation:</strong> Infos per Mail'


def test_registration_line(tour):
    assert 'mindestens 3, maximal 6 Teilnehmer.</p>' in tour.details()


def test_costs_and_organisation(tour):
    tour.advances, tour.advances_info = Decimal('50'), 'Hüttenreservierung'
    tour.admission = Decimal('30')
    tour.extra_charges, tour.extra_charges_info = Decimal('40'), 'Halbpension'
    tour.save()
    tour.refresh_from_db()  # Beträge wie aus der Datenbank, mit zwei Nachkommastellen
    lines = costs_paragraph(tour.details())
    assert lines == [
        '<strong>Anzahlung:</strong> 50 € für Hüttenreservierung',
        '<strong>Teilnahmegebühr:</strong> 30 €',
        '<strong>Zusatzkosten:</strong> 40.00 € für Halbpension',
        '<strong>Fahrtkostenbeteiligung:</strong> ca. 7 € für ungefähr 100 km',
        '<strong>Organisation:</strong> ',
    ]


def test_free_tour_still_names_the_fee(tour):
    tour.admission = Decimal('0')
    tour.save()
    assert '<strong>Teilnahmegebühr:</strong> 0 €' in costs_paragraph(tour.details())


def test_conditions_and_questions_close_the_text(tour):
    assert tour.details().endswith(homepage.CONDITIONS + homepage.QUESTIONS)


def test_single_line_fields_are_escaped(tour):
    event = tour.tour
    event.name = 'Grat <script>alert(1)</script> & Gipfel'
    event.source = 'Hütte "Alpenrose" <b>'
    event.save()
    tour.info, tour.advances, tour.advances_info = '', Decimal('10'), '<i>Bus</i>'
    tour.save()
    details = tour.details()
    assert '<h3>Grat &lt;script&gt;alert(1)&lt;/script&gt; &amp; Gipfel</h3>' in details
    assert '<strong>Ausgangspunkt:</strong> Hütte &quot;Alpenrose&quot; &lt;b&gt;' in details
    assert 'für &lt;i&gt;Bus&lt;/i&gt;' in details
    assert '<script>' not in details


def test_description_keeps_allowed_tags_and_drops_the_rest(tour):
    event = tour.tour
    event.description = (
        '<p>Start <strong>früh</strong></p><ul><li>Helm</li></ul>'
        '<a href="https://dav-ke.info/SKT-801" onclick="x()">Info</a>'
        '<a href="javascript:alert(1)">böse</a><script>alert(1)</script><img src="x" onerror="y()">'
        ' Kosten < 10 & so'
    )
    event.save()
    details = tour.details()
    assert '<p>Start <strong>früh</strong></p><ul><li>Helm</li></ul>' in details
    assert '<a href="https://dav-ke.info/SKT-801">Info</a>' in details
    assert '<a>böse</a>' in details
    for dropped in ('<script', 'onclick', 'onerror', 'javascript:', '<img'):
        assert dropped not in details
    assert 'Kosten &lt; 10 &amp; so' in details


def test_appointment_without_any_time_starts_with_the_date(tour):
    event = tour.tour
    event.start_time = event.approximate = None
    event.end_date = None
    event.name = 'Langtitel'
    event.save()
    text = event.appointment()
    assert not text.startswith(',')
    assert text.split(', ')[0].startswith('10.7.')
    assert text.split(', ')[1] == 'Langtitel'


def test_appointment_without_time_shows_the_date_range(tour):
    event = tour.tour
    event.start_time = event.approximate = None
    event.end_date = datetime.date(NEXT, 7, 12)
    event.save()
    first = event.appointment(with_places=False)
    assert first.startswith('10.7.') and ' bis 12.7.' in first


def test_departure_labels_the_meeting_point_once(tour):
    line = places_paragraph(tour.details())[1]
    assert ', Treffpunkt: Alpinzentrum Kempten, Parkplatz, Heimkehr' in line
    event = tour.tour
    event.rendezvous = 'Treffpunkt:  Alpinzentrum Kempten, Parkplatz'
    event.save()
    line = places_paragraph(tour.details())[1]
    assert line.count('Treffpunkt') == 1
    assert ', Treffpunkt: Alpinzentrum Kempten, Parkplatz, Heimkehr' in line


def test_preliminary_meeting_point_stays_unlabelled(tour):
    assert places_paragraph(tour.details())[0].endswith('19 Uhr, Alpinzentrum Kempten, Seminarraum')
