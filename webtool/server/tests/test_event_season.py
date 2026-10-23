# -*- coding: utf-8 -*-
"""Plan 3, Task 3: an event belongs to the season of its start year.

The tests create real tours and courses through the frontend API; fixtures in
conftest.py (seeded, api, course_topic), helpers in helpers.py.
"""
from server.models import Season, Tour
from server.tests.helpers import NEXT, THIS, day, post_course, post_tour, put


def test_a_tour_in_next_year_lands_in_next_season(api):
    tour = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))

    assert tour.tour.season.name == str(NEXT)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert Season.objects.get(current=True).name == str(THIS)


def test_numbering_restarts_at_01_each_year(api):
    first_next = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    second_next = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))
    this_year = post_tour(api, day(THIS, '09-01'), day(THIS, '08-15'))

    assert str(first_next.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert str(second_next.tour.reference) == 'SKT-{}02'.format(NEXT % 10)
    assert str(this_year.tour.reference) == 'SKT-{}01'.format(THIS % 10)


def test_satellites_follow_the_main_event_season(api):
    """A deadline in December for a January tour belongs to the tour's season
    and carries its year digit."""
    tour = post_tour(api, day(NEXT, '01-10'), day(THIS, '12-15'), preliminary=day(THIS, '12-01'))

    assert tour.deadline.season.name == str(NEXT)
    assert tour.preliminary.season.name == str(NEXT)
    assert str(tour.deadline.reference).endswith('-{}01'.format(NEXT % 10))


def test_a_preliminary_added_later_uses_the_tour_season(api):
    tour = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))

    put(api, '/api/frontend/tours/{}/'.format(tour.pk),
        lambda body: body.update(preliminary={'startDate': day(THIS, '12-01')}))

    tour.refresh_from_db()
    assert tour.preliminary.season.name == str(NEXT)


def test_a_course_in_next_year_and_its_meetings_use_its_season(api, course_topic):
    course = post_course(api, course_topic, day(NEXT, '03-01'))

    def add_meeting(body):
        body['meetings'].append({'startDate': day(NEXT, '03-08')})
    put(api, '/api/frontend/instructions/{}/'.format(course.pk), add_meeting)

    course.refresh_from_db()
    assert course.instruction.season.name == str(NEXT)
    assert [m.season.name for m in course.meeting_list.all()] == [str(NEXT)]


def test_moving_the_start_date_to_another_year_while_in_work_rekeys_the_event(api):
    """D1: while In Arbeit or Fertig the event follows its new year -- season,
    booking code and satellites. The Reference row itself stays (it is the
    event's primary key); only its season and number change."""
    tour = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'))
    reference_pk = tour.tour.reference.pk

    def move(body):
        body['tour']['startDate'] = day(NEXT, '01-10')
    put(api, '/api/frontend/tours/{}/'.format(tour.pk), move)

    tour = Tour.objects.get(pk=tour.pk)
    assert tour.tour.season.name == str(NEXT)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(NEXT % 10)
    assert tour.tour.reference.pk == reference_pk
    assert tour.deadline.season.name == str(NEXT)
    assert str(tour.deadline.reference).endswith('-{}01'.format(NEXT % 10))


def test_moving_the_start_date_keeps_season_and_code_once_released(api):
    """D1: from Freigegeben on the code may already be printed."""
    tour = post_tour(api, day(THIS, '12-20'), day(THIS, '12-01'), state_name='Freigegeben')

    def move(body):
        body['tour']['startDate'] = day(NEXT, '01-10')
    put(api, '/api/frontend/tours/{}/'.format(tour.pk), move)

    tour = Tour.objects.get(pk=tour.pk)
    assert tour.tour.season.name == str(THIS)
    assert str(tour.tour.reference) == 'SKT-{}01'.format(THIS % 10)


def test_codes_already_used_for_this_year_in_the_previous_season_are_skipped(api):
    """Before plan 3, events of next year were put into the current season with
    next year's digit (BGT-701 in season 2026). A new event in season 2027 must
    not hand out the same code string again."""
    legacy = post_tour(api, day(NEXT, '02-01'), day(NEXT, '01-15'))
    # Put it back where the old code would have left it: current season, next year's digit.
    reference = legacy.tour.reference
    reference.season = Season.objects.get(name=str(THIS))
    reference.save()
    legacy.tour.season = reference.season
    legacy.tour.save()
    assert str(reference) == 'SKT-{}01'.format(NEXT % 10)

    new = post_tour(api, day(NEXT, '03-01'), day(NEXT, '02-15'))

    assert new.tour.season.name == str(NEXT)
    assert str(new.tour.reference) == 'SKT-{}02'.format(NEXT % 10)
