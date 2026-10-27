# -*- coding: utf-8 -*-
"""Veranstaltungen in die Saison ihres Starttermins rücken.

Die Saison beginnt am 1. Dezember, siehe `defaults.season_year` -- ein
Dezembertermin gehört also schon zur folgenden Saison.
"""
from io import StringIO

from django.core.management import call_command

from server.models import Event, Season, Tour
from server.tests.helpers import NEXT, THIS, day, post_course, post_tour


def legacy(event_group, season_name):
    """Put an event and its satellites back into `season_name`, as the code
    before plan 3 did with next year's events: same booking code, wrong season."""
    season = Season.objects.get(name=season_name)
    for event in event_group:
        Event.objects.filter(pk=event.pk).update(season=season)
        event.reference.season = season
        event.reference.save()


def realign(*args):
    out = StringIO()
    call_command('realign_seasons', *args, stdout=out)
    return out.getvalue()


def tour_events(tour):
    tour = Tour.objects.get(pk=tour.pk)
    return [e for e in (tour.tour, tour.deadline, tour.preliminary) if e is not None]


def test_dry_run_reports_and_changes_nothing(api):
    tour = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    legacy(tour_events(tour), str(THIS))
    code = str(Tour.objects.get(pk=tour.pk).tour.reference)

    output = realign()

    assert code in output and str(NEXT) in output
    assert Tour.objects.get(pk=tour.pk).tour.season.name == str(THIS)


def test_apply_moves_event_satellites_and_reference_keeping_the_code(api):
    tour = post_tour(api, day(NEXT, '01-10'), day(THIS, '12-15'), preliminary=day(THIS, '12-01'))
    legacy(tour_events(tour), str(THIS))
    before = [str(e.reference) for e in tour_events(tour)]

    realign('--apply')

    events = tour_events(tour)
    assert {e.season.name for e in events} == {str(NEXT)}
    assert {e.reference.season.name for e in events} == {str(NEXT)}
    assert [str(e.reference) for e in events] == before


def test_apply_moves_a_course_with_its_meetings(api, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-01'))
    api.put(
        '/api/frontend/instructions/{}/'.format(course.pk),
        dict(api.get('/api/frontend/instructions/{}/'.format(course.pk)).json(),
             meetings=[{'startDate': day(NEXT, '03-08')}]),
        format='json',
    )
    group = [course.instruction, *Event.objects.filter(instruction=course)]
    legacy(group, str(THIS))

    realign('--apply')

    assert {Event.objects.get(pk=e.pk).season.name for e in group} == {str(NEXT)}


def test_apply_skips_and_reports_a_code_collision(api):
    """If the target season already uses the same code string, moving would make
    it ambiguous; the event stays and is reported."""
    stuck = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    legacy(tour_events(stuck), str(THIS))
    stuck_code = str(Tour.objects.get(pk=stuck.pk).tour.reference)
    # Free the number in NEXT, then let a new tour of NEXT take the same code.
    clash = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))
    clash.tour.reference.reference = Tour.objects.get(pk=stuck.pk).tour.reference.reference
    clash.tour.reference.save()
    assert str(Tour.objects.get(pk=clash.pk).tour.reference) == stuck_code

    output = realign('--apply')

    assert Tour.objects.get(pk=stuck.pk).tour.season.name == str(THIS)
    assert stuck_code in output and 'übersprungen' in output


def test_apply_creates_the_target_season_if_missing(api):
    import datetime

    tour = post_tour(api, day(THIS, '06-01'), day(THIS, '05-15'))
    Event.objects.filter(pk=tour.tour_id).update(start_date=datetime.date(NEXT + 1, 2, 1))
    assert not Season.objects.filter(name=str(NEXT + 1)).exists()

    realign('--apply')

    assert Tour.objects.get(pk=tour.pk).tour.season.name == str(NEXT + 1)


def test_events_in_their_own_season_are_left_alone(api):
    tour = post_tour(api, day(THIS, '06-01'), day(THIS, '05-15'))

    output = realign('--apply')

    assert Tour.objects.get(pk=tour.pk).tour.season.name == str(THIS)
    assert 'keine' in output


def test_a_december_event_moves_into_the_following_season(api):
    """Der Fall, für den die Saisongrenze verschoben wurde: eine Dezembertour
    gehört zum Winter des Folgejahres."""
    tour = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'))
    legacy(tour_events(tour), str(THIS))

    realign('--apply')

    assert {e.season.name for e in tour_events(tour)} == {str(NEXT)}


def test_a_november_event_stays_where_it_is(api):
    tour = post_tour(api, day(THIS, '11-30'), day(THIS, '11-15'))

    realign('--apply')

    assert Tour.objects.get(pk=tour.pk).tour.season.name == str(THIS)


def test_since_leaves_everything_before_the_cutoff_alone(api):
    """Nach einer Regeländerung gilt sonst auch jede vergangene Veranstaltung
    als falsch einsortiert -- die Vergangenheit wird nicht umgeschrieben."""
    old = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'))
    legacy(tour_events(old), str(THIS))
    new = post_tour(api, day(NEXT, '12-20'), day(NEXT, '12-01'))
    legacy(tour_events(new), str(NEXT))

    realign('--apply', '--since', day(NEXT, '01-01'))

    assert Tour.objects.get(pk=old.pk).tour.season.name == str(THIS)
    assert Tour.objects.get(pk=new.pk).tour.season.name == str(NEXT + 1)


def test_since_rejects_a_date_it_cannot_read(api):
    from django.core.management.base import CommandError
    import pytest

    with pytest.raises(CommandError):
        realign('--since', '01.12.2026')


def test_two_legacy_events_with_the_same_code_for_one_year(api):
    """Production has e.g. two GSK-701 for January 2027, one in season 2025 and
    one in 2026. Only one can move; the one from the newer season does -- it is
    the one the current season shows today -- and the dry run reports the clash
    already, not only the real run."""
    older_season = Season.for_year(THIS - 1)
    # Created first, so it has the lower id: the order must come from the season.
    older = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))
    legacy(tour_events(older), older_season.name)
    newer = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    legacy(tour_events(newer), str(THIS))
    code = str(Tour.objects.get(pk=newer.pk).tour.reference)
    reference = Tour.objects.get(pk=older.pk).tour.reference
    reference.reference = Tour.objects.get(pk=newer.pk).tour.reference.reference
    reference.save()
    assert str(Tour.objects.get(pk=older.pk).tour.reference) == code

    dry = realign()
    realign('--apply')

    skipped = [line for line in dry.splitlines() if '-- übersprungen' in line]
    assert len(skipped) == 1 and code in skipped[0] and older_season.name in skipped[0]
    assert Tour.objects.get(pk=newer.pk).tour.season.name == str(NEXT)
    assert Tour.objects.get(pk=older.pk).tour.season.name == older_season.name


def test_on_a_clash_the_event_resolvable_today_wins(api):
    """Two events of the same season carry the same code for next year, one of
    them with its code row in an older season. The consistent one keeps the code
    -- the homepage resolves it today; the other is reported."""
    stale = Season.for_year(THIS - 1)
    # Inconsistent one first, so it has the lower id.
    broken = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))
    legacy(tour_events(broken), str(THIS))
    for event in tour_events(broken):
        event.reference.season = stale
        event.reference.save()
    consistent = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    legacy(tour_events(consistent), str(THIS))
    reference = Tour.objects.get(pk=broken.pk).tour.reference
    reference.reference = Tour.objects.get(pk=consistent.pk).tour.reference.reference
    reference.save()
    code = str(Tour.objects.get(pk=consistent.pk).tour.reference)
    assert str(Tour.objects.get(pk=broken.pk).tour.reference) == code

    realign('--apply')

    assert Tour.objects.get(pk=consistent.pk).tour.reference.season.name == str(NEXT)
    assert Tour.objects.get(pk=broken.pk).tour.reference.season.name == stale.name
