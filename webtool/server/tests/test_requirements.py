# -*- coding: utf-8 -*-
"""Bedarfsanzeige: Soll-Zahlen je Kurs-/Tourenart gegen den Ist-Stand.

Nutzt die Fixtures aus conftest.py, die über init_season eine echte Saison
aufbauen und Touren und Kurse über die Frontend-API anlegen.
"""
import datetime

import pytest

from server.models import Category, Requirement, Season
from server.tests.helpers import LAST, NEXT, THIS, day, post_course, post_tour, state


def requirement(season, category, kind, minimum, maximum=None, order=0):
    return Requirement.objects.create(
        season=season, category=category, kind=kind,
        minimum=minimum, maximum=maximum, order=order,
    )


def group(overview, kind):
    """Die Gruppe einer Art über alle Abschnitte hinweg, zu einer verschmolzen.

    Die meisten Tests arbeiten mit einer einzigen Kategorie und interessieren
    sich nicht für die Jahreszeit; die Abschnitte prüfen eigene Tests.
    """
    groups = [g for section in overview['sections'] for g in section['groups'] if g['kind'] == kind]
    if not groups:
        return dict(kind=kind, entries=[], unplanned=[], minimum=0, maximum=0, actual=0)
    merged = dict(groups[0])
    for key in ('entries', 'unplanned'):
        merged[key] = [row for g in groups for row in g[key]]
    for key in ('minimum', 'maximum', 'actual'):
        merged[key] = sum(g[key] for g in groups)
    return merged


def section(overview, part):
    return next((s for s in overview['sections'] if s['part'] == part), None)


def entry(overview, kind, code):
    rows = group(overview, kind)['entries'] + group(overview, kind)['unplanned']
    return next(row for row in rows if row['code'] == code)


@pytest.fixture
def skitour(seeded):
    return Category.objects.get(code='SKT')


def test_span_and_actual_count(api, seeded, skitour):
    """Eine Spanne bleibt als Unter- und Obergrenze erhalten, daneben der Ist-Stand."""
    requirement(seeded, skitour, Requirement.TOUR, 3, 4)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'))
    post_tour(api, day(THIS, '03-08'), day(THIS, '02-27'))

    row = entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')
    assert (row['minimum'], row['maximum'], row['actual']) == (3, 4, 2)


def test_without_span_maximum_equals_minimum(api, seeded, skitour):
    requirement(seeded, skitour, Requirement.TOUR, 5)

    row = entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')
    assert (row['minimum'], row['maximum'], row['actual']) == (5, 5, 0)


def test_canceled_tours_do_not_count(api, seeded, skitour):
    """Der Bedarf fragt nach dem Planungsstand -- Ausgefallenes füllt ihn nicht."""
    requirement(seeded, skitour, Requirement.TOUR, 3)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'))
    canceled = post_tour(api, day(THIS, '03-08'), day(THIS, '02-27'))
    canceled.state = state('Ausgefallen')
    canceled.save()

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1


def test_deleted_and_internal_tours_do_not_count(api, seeded, skitour):
    requirement(seeded, skitour, Requirement.TOUR, 3)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'))

    deleted = post_tour(api, day(THIS, '03-08'), day(THIS, '02-27'))
    deleted.deprecated = True
    deleted.save()

    internal = post_tour(api, day(THIS, '03-15'), day(THIS, '03-05'))
    internal.tour.internal = True
    internal.tour.save()

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1


def test_every_state_but_canceled_counts(api, seeded, skitour):
    """In Arbeit zählt genauso wie Veröffentlicht."""
    requirement(seeded, skitour, Requirement.TOUR, 3)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'), state_name='In Arbeit')
    post_tour(api, day(THIS, '03-08'), day(THIS, '02-27'), state_name='Freigegeben')

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 2


def test_courses_count_through_their_topic(api, seeded, course_topic):
    requirement(seeded, course_topic.category, Requirement.INSTRUCTION, 2)
    post_course(api, course_topic, day(THIS, '04-10'))

    row = entry(Requirement.overview(seeded), Requirement.INSTRUCTION, 'GKX')
    assert (row['name'], row['minimum'], row['actual']) == ('Grundkurs Test', 2, 1)


def test_course_label_falls_back_to_category_name(seeded):
    """Ohne Kursinhalt bleibt die Kategoriebezeichnung stehen."""
    category = Category.objects.create(code='XYZ', name='Namenlos', order=10, topic=True)
    category.seasons.add(seeded)
    requirement(seeded, category, Requirement.INSTRUCTION, 1)

    assert entry(Requirement.overview(seeded), Requirement.INSTRUCTION, 'XYZ')['name'] == 'Namenlos'


def test_tours_without_a_target_stay_out_of_the_totals(api, seeded, skitour):
    """Sommertouren dürfen einen Winterbedarf nicht als erfüllt erscheinen lassen."""
    requirement(seeded, skitour, Requirement.TOUR, 10)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'))

    bergtour = Category.objects.get(code='BGT')
    reference = Category.objects.get(code='SKT')
    assert bergtour != reference  # beide sind Tourenkategorien der Saison

    tours = group(Requirement.overview(seeded), Requirement.TOUR)
    assert (tours['minimum'], tours['maximum'], tours['actual']) == (10, 10, 1)
    assert [row['code'] for row in tours['entries']] == ['SKT']


def test_events_without_a_target_appear_as_unplanned(api, seeded, course_topic):
    """Was ohne Vorgabe läuft, wird trotzdem sichtbar -- nur getrennt."""
    post_course(api, course_topic, day(THIS, '04-10'))

    courses = group(Requirement.overview(seeded), Requirement.INSTRUCTION)
    assert courses['entries'] == []
    assert [(row['code'], row['actual'], row['id']) for row in courses['unplanned']] == [('GKX', 1, None)]


def test_a_target_of_zero_is_not_a_gap(api, seeded, course_topic):
    """Bedarf 0 heißt "nicht geplant" -- keine Zeile, keine Summe."""
    requirement(seeded, course_topic.category, Requirement.INSTRUCTION, 0)

    courses = group(Requirement.overview(seeded), Requirement.INSTRUCTION)
    assert courses['entries'] == []
    assert courses['unplanned'] == []
    assert courses['minimum'] == 0


def test_deprecated_requirements_are_ignored(seeded, skitour):
    target = requirement(seeded, skitour, Requirement.TOUR, 7)
    target.deprecated = True
    target.save()

    assert group(Requirement.overview(seeded), Requirement.TOUR)['entries'] == []


def test_requirements_are_scoped_to_their_season(api, seeded, skitour):
    """Die Touren eines Programmjahrs füllen keinen Bedarf des nächsten."""
    following = Season.for_year(THIS + 1)
    requirement(seeded, skitour, Requirement.TOUR, 3)
    requirement(following, skitour, Requirement.TOUR, 3)
    post_tour(api, day(THIS, '03-01'), day(THIS, '02-20'))

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1
    assert entry(Requirement.overview(following), Requirement.TOUR, 'SKT')['actual'] == 0


# --- Programmjahr -----------------------------------------------------------

def test_the_program_year_runs_from_december_to_november(seeded):
    """Programmjahr 2027 heißt 1.12.2026 bis 30.11.2027."""
    start, end = Requirement.program_window(seeded)

    assert start == datetime.date(THIS - 1, 12, 1)
    assert end == datetime.date(THIS, 12, 1)


def test_the_window_is_named_in_the_overview(seeded):
    data = Requirement.overview(seeded)

    assert data['periodStart'] == datetime.date(THIS - 1, 12, 1)
    assert data['periodEnd'] == datetime.date(THIS, 11, 30)


def test_the_program_year_switches_in_october_not_in_january():
    """Der Kern der Datumslogik: im Januar bleibt die Anzeige beim laufenden
    Winter, und ab Oktober zeigt sie auf den kommenden."""
    year = Requirement.program_year

    assert year(datetime.date(2026, 9, 30)) == 2026
    assert year(datetime.date(2026, 10, 1)) == 2027   # Planung beginnt
    assert year(datetime.date(2026, 12, 1)) == 2027   # Programm beginnt
    assert year(datetime.date(2027, 1, 15)) == 2027   # kein Sprung im Januar
    assert year(datetime.date(2027, 9, 30)) == 2027
    assert year(datetime.date(2027, 10, 1)) == 2028


def test_last_winter_does_not_count_but_this_one_does(api, seeded, skitour):
    """Das Kalenderjahr würde den Winter mitten durchschneiden.

    Im Programmjahr THIS (1.12. des Vorjahres bis 30.11.) zählt der Januar
    dieses Jahres, der Januar des Vorjahres gehört zum vorigen Programm.
    """
    requirement(seeded, skitour, Requirement.TOUR, 5)
    post_tour(api, day(LAST, '01-15'), day(LAST, '01-05'))   # voriger Winter
    post_tour(api, day(THIS, '01-15'), day(LAST, '12-20'))   # dieser Winter

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1


def test_december_opens_the_program_year(api, seeded, skitour):
    """Der Dezember des Vorjahres zählt mit -- er eröffnet das Programmjahr."""
    requirement(seeded, skitour, Requirement.TOUR, 5)
    post_tour(api, day(LAST, '12-27'), day(LAST, '12-10'))

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1


def test_the_window_ends_the_day_before_the_next_one_starts(api, seeded, skitour):
    requirement(seeded, skitour, Requirement.TOUR, 5)
    post_tour(api, day(LAST, '11-30'), day(LAST, '11-15'))   # davor
    post_tour(api, day(LAST, '12-01'), day(LAST, '11-20'))   # erster Tag
    post_tour(api, day(THIS, '11-30'), day(THIS, '11-15'))   # letzter Tag
    post_tour(api, day(THIS, '12-01'), day(THIS, '11-20'))   # danach

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 2


def test_the_date_decides_not_the_season_the_event_sits_in(api, seeded, skitour):
    """Eine falsch einsortierte Tour zählt trotzdem richtig mit.

    `realign_seasons` zieht die Saison dem Startjahr nach; bis das gelaufen
    ist, darf die Bedarfsanzeige nicht danebenliegen.
    """
    requirement(seeded, skitour, Requirement.TOUR, 5)
    tour = post_tour(api, day(THIS, '02-10'), day(THIS, '01-20'))
    tour.tour.season = Season.for_year(THIS - 1)  # in der falschen Saison
    tour.tour.save()

    assert entry(Requirement.overview(seeded), Requirement.TOUR, 'SKT')['actual'] == 1


def test_entries_follow_their_order(seeded):
    second = Category.objects.get(code='SST')
    first = Category.objects.get(code='SKT')
    requirement(seeded, second, Requirement.TOUR, 1, order=20)
    requirement(seeded, first, Requirement.TOUR, 1, order=10)

    codes = [row['code'] for row in group(Requirement.overview(seeded), Requirement.TOUR)['entries']]
    assert codes == ['SKT', 'SST']


def test_maximum_below_minimum_is_rejected(seeded, skitour):
    from django.core.exceptions import ValidationError

    target = Requirement(season=seeded, category=skitour, kind=Requirement.TOUR, minimum=5, maximum=3)
    with pytest.raises(ValidationError):
        target.full_clean()


def test_one_requirement_per_season_kind_and_category(seeded, skitour):
    from django.db import IntegrityError

    requirement(seeded, skitour, Requirement.TOUR, 3)
    with pytest.raises(IntegrityError):
        requirement(seeded, skitour, Requirement.TOUR, 4)


# --- Winter, Sommer, ganzjährig ---------------------------------------------

def test_winter_and_summer_are_separate_sections(seeded):
    """Winter- und Sommerprogramm werden getrennt geplant und getrennt gezeigt."""
    requirement(seeded, Category.objects.get(code='SKT'), Requirement.TOUR, 30)
    requirement(seeded, Category.objects.get(code='BGT'), Requirement.TOUR, 12)

    data = Requirement.overview(seeded)

    assert [s['part'] for s in data['sections']] == ['winter', 'summer']
    assert [e['code'] for e in section(data, 'winter')['groups'][0]['entries']] == ['SKT']
    assert [e['code'] for e in section(data, 'summer')['groups'][0]['entries']] == ['BGT']


def test_the_season_part_comes_from_the_category(seeded):
    skitour = Category.objects.get(code='SKT')
    bergtour = Category.objects.get(code='BGT')
    indoor = Category.objects.create(code='HAL', name='Halle', order=10, topic=True)

    assert (skitour.winter, bergtour.summer) == (True, True)
    assert Requirement.part_of(skitour) == Requirement.WINTER
    assert Requirement.part_of(bergtour) == Requirement.SUMMER
    assert Requirement.part_of(indoor) == Requirement.ALL_YEAR


def test_a_section_is_named_after_its_place_in_the_program_year(seeded):
    """Der Winter liegt über den Jahreswechsel, der Sommer nicht."""
    assert Requirement.part_label(Requirement.WINTER, 2027) == 'Winter 2026/27'
    assert Requirement.part_label(Requirement.SUMMER, 2027) == 'Sommer 2027'
    assert Requirement.part_label(Requirement.ALL_YEAR, 2027) == 'Ganzjährig'


def test_a_year_round_category_gets_its_own_section(seeded):
    indoor = Category.objects.create(code='HAL', name='Hallenkurs', order=10, topic=True)
    indoor.seasons.add(seeded)
    requirement(seeded, indoor, Requirement.INSTRUCTION, 3)

    data = Requirement.overview(seeded)

    assert [s['part'] for s in data['sections']] == ['other']
    assert data['sections'][0]['label'] == 'Ganzjährig'


def test_a_section_totals_only_its_own_groups(api, seeded):
    requirement(seeded, Category.objects.get(code='SKT'), Requirement.TOUR, 10)
    requirement(seeded, Category.objects.get(code='BGT'), Requirement.TOUR, 4)
    post_tour(api, day(THIS, '02-01'), day(THIS, '01-15'))  # eine Skitour

    data = Requirement.overview(seeded)

    assert (section(data, 'winter')['actual'], section(data, 'winter')['minimum']) == (1, 10)
    assert (section(data, 'summer')['actual'], section(data, 'summer')['minimum']) == (0, 4)


def test_an_empty_group_is_left_out_of_its_section(seeded):
    """Im Sommer gibt es bislang nur Kursbedarfe -- dann keine leere Tourenliste."""
    requirement(seeded, Category.objects.get(code='SKT'), Requirement.TOUR, 5)

    data = Requirement.overview(seeded)

    assert [g['kind'] for g in section(data, 'winter')['groups']] == ['tour']
    assert section(data, 'summer') is None


def test_an_event_without_a_target_lands_in_its_own_section(api, seeded):
    """Auch ohne Vorgabe entscheidet die Kategorie über den Abschnitt."""
    requirement(seeded, Category.objects.get(code='SKT'), Requirement.TOUR, 5)
    post_tour(api, day(THIS, '02-01'), day(THIS, '01-15'))

    bergtour = Category.objects.get(code='BGT')
    tour = post_tour(api, day(THIS, '07-01'), day(THIS, '06-15'))
    reference = tour.tour.reference
    reference.category = bergtour
    reference.save()

    data = Requirement.overview(seeded)

    assert [e['code'] for e in section(data, 'summer')['groups'][0]['unplanned']] == ['BGT']
    assert section(data, 'summer')['minimum'] == 0


# --- Endpunkt ---------------------------------------------------------------

@pytest.fixture
def planning_season(seeded):
    """Die Saison, die der Endpunkt zeigt -- je nach Datum THIS oder THIS+1."""
    return Season.for_year(Requirement.program_year())


def test_endpoint_returns_the_sections(api, planning_season, skitour):
    requirement(planning_season, skitour, Requirement.TOUR, 3, 4)

    response = api.get('/api/frontend/requirements/')
    assert response.status_code == 200
    body = response.json()
    assert body['season'] == str(Requirement.program_year())
    # Die Skitour ist eine Winterkategorie, also genau ein Abschnitt mit einer
    # Gruppe -- leere Gruppen fallen weg.
    assert [s['part'] for s in body['sections']] == ['winter']
    tours = body['sections'][0]['groups'][0]
    assert tours['kind'] == 'tour'
    assert tours['entries'][0]['maximum'] == 4


def test_endpoint_follows_the_program_year_not_the_current_season(api, planning_season, skitour):
    """Der Bedarf der laufenden Saison ist nicht zwangsläufig der gezeigte.

    Im Herbst zeigt die Anzeige schon auf das kommende Programmjahr, während
    Season.current noch auf dem alten steht.
    """
    requirement(planning_season, skitour, Requirement.TOUR, 7)
    current = Season.objects.get(current=True)
    if current != planning_season:
        requirement(current, skitour, Requirement.TOUR, 99)

    body = api.get('/api/frontend/requirements/').json()
    assert body['sections'][0]['groups'][0]['entries'][0]['minimum'] == 7


def test_endpoint_answers_without_a_season_for_the_program_year(api, seeded):
    """Fehlt die Saison, kommt eine leere Antwort statt eines Fehlers."""
    Season.objects.filter(name=str(Requirement.program_year())).delete()

    response = api.get('/api/frontend/requirements/')
    assert response.status_code == 200
    body = response.json()
    assert body['season'] == str(Requirement.program_year())
    assert body['sections'] == []


def test_endpoint_is_not_cached(api, seeded):
    response = api.get('/api/frontend/requirements/')
    assert response['Cache-Control'] == 'no-store'


def test_endpoint_needs_a_login(seeded):
    from rest_framework.test import APIClient

    response = APIClient(HTTP_HOST='localhost').get('/api/frontend/requirements/')
    assert response.status_code in (401, 403)


# --- init_requirements ------------------------------------------------------

def test_init_requirements_is_idempotent(seeded, course_topic):
    from django.core.management import call_command

    call_command('init_requirements', '--season', seeded.name)
    created = Requirement.objects.filter(season=seeded).count()
    assert created > 0

    target = Requirement.objects.filter(season=seeded, kind=Requirement.TOUR).first()
    target.minimum = 9
    target.save()

    call_command('init_requirements', '--season', seeded.name)
    assert Requirement.objects.filter(season=seeded).count() == created
    target.refresh_from_db()
    assert target.minimum == 9


def test_init_requirements_defaults_to_the_program_year(planning_season):
    """Ohne --season dieselbe Saison, die auch die Anzeige führt."""
    from django.core.management import call_command

    call_command('init_requirements')

    assert Requirement.objects.filter(season=planning_season).exists()


def test_init_requirements_copies_the_previous_season(seeded, skitour):
    from django.core.management import call_command

    requirement(seeded, skitour, Requirement.TOUR, 30, 32, order=3)
    following = Season.for_year(THIS + 1)

    call_command('init_requirements', '--season', following.name, '--copy-from', seeded.name)

    copied = Requirement.objects.get(season=following, kind=Requirement.TOUR, category=skitour)
    # Die Reihenfolge gehört zur Pflege und wandert mit, sonst steht die neue
    # Saison alphabetisch statt in der eingestellten Folge.
    assert (copied.minimum, copied.maximum, copied.order) == (30, 32, 3)
