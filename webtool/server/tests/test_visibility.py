# -*- coding: utf-8 -*-
"""Plan 3, Task 6: the client API shows this and next season, the frontend
last, this and next -- computed per request."""
from django.contrib.auth import get_user_model
from django.core.management import call_command

from server.models import Category, Guide, Season, Topic, Tour
from server.tests.helpers import LAST, NEXT, THIS, day, post_course, post_tour, state


def codes(response):
    assert response.status_code == 200, response.content
    return sorted(row['reference'] for row in response.json())


def tours_by_year(api):
    """One tour in each of five years around this one; returns their codes by year."""
    return {
        year: str(post_tour(api, day(year, '06-01'), day(year, '05-15')).tour.reference)
        for year in (LAST - 1, LAST, THIS, NEXT, NEXT + 1)
    }


def test_frontend_tours_list_last_this_and_next_season(api):
    by_year = tours_by_year(api)

    listed = codes(api.get('/api/frontend/tours/'))

    assert listed == sorted(by_year[y] for y in (LAST, THIS, NEXT))


def test_frontend_courses_list_last_this_and_next_season(api, course_topic):
    by_year = {
        year: str(post_course(api, course_topic, day(year, '06-01')).instruction.reference)
        for year in (LAST - 1, LAST, THIS, NEXT, NEXT + 1)
    }

    listed = codes(api.get('/api/frontend/instructions/'))

    assert listed == sorted(by_year[y] for y in (LAST, THIS, NEXT))


def test_frontend_window_follows_the_current_season_without_restart(api):
    """The old filters were computed once at import time."""
    by_year = tours_by_year(api)

    call_command('rollover_season', '--today', day(NEXT, '01-01'))

    listed = codes(api.get('/api/frontend/tours/'))
    assert listed == sorted(by_year[y] for y in (THIS, NEXT, NEXT + 1))


def test_frontend_tour_calendar_uses_the_window(api):
    """The calendar rows carry the tour id, not the booking code."""
    tour_ids = {
        year: post_tour(api, day(year, '06-01'), day(year, '05-15')).pk
        for year in (LAST - 1, LAST, THIS, NEXT, NEXT + 1)
    }

    response = api.get('/api/frontend/tourcalendar/')
    assert response.status_code == 200, response.content

    assert {row['id'] for row in response.json()} == {tour_ids[y] for y in (LAST, THIS, NEXT)}


def test_client_topics_and_guides_use_the_client_window(client, seeded):
    last = Season.for_year(LAST)
    next_ = Season.for_year(NEXT)

    def topic(code, season):
        category = Category.objects.create(code=code, name=code, order=10, topic=True)
        created = Topic.objects.create(category=category, title=code, name=code)
        created.seasons.add(season)

    def guide(username, season):
        user = get_user_model().objects.create(username=username, first_name=username, last_name='Test')
        Guide.objects.create(user=user).seasons.add(season)

    topic('TNX', next_)
    topic('TLS', last)
    guide('nextguide', next_)
    guide('lastguide', last)

    topics = {row['id'] for row in client.get('/api/client/topics/').json()}
    guides = client.get('/api/client/guides/').content.decode()

    assert 'TNX' in topics and 'TLS' not in topics
    assert 'nextguide' in guides and 'lastguide' not in guides


def test_values_cover_the_frontend_window_without_duplicates(api, seeded):
    """D3: a topic only linked to last season still shows when editing an old
    course; one linked to several seasons appears once."""
    last = Season.for_year(LAST)
    category = Category.objects.create(code='TLS', name='Nur letztes Jahr', order=10, topic=True)
    only_last = Topic.objects.create(category=category, title='Nur letztes Jahr', name='x')
    only_last.seasons.add(last)
    category = Category.objects.create(code='TAL', name='Immer', order=10, topic=True)
    always = Topic.objects.create(category=category, title='Immer', name='x')
    always.seasons.add(last, seeded)

    topics = [row['id'] for row in api.get('/api/frontend/values/').json()['topics']]

    assert only_last.pk in topics
    assert topics.count(always.pk) == 1


def test_timer_update_completes_last_seasons_events_after_rollover(api):
    """After 1 January a tour of late December belongs to last season. The old
    command only looked at the current season and left it published."""
    tour = post_tour(api, day(LAST, '12-28'), day(LAST, '12-01'))
    Tour.objects.filter(pk=tour.pk).update(state=state('Veröffentlicht'))

    call_command('timer_update')

    tour.refresh_from_db()
    assert tour.state.name == 'Durchgeführt'
