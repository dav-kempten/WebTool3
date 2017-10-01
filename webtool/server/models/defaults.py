# -*- coding: utf-8 -*-
from datetime import datetime

from django.apps import apps


def get_default_year():
    return datetime.now().year


def get_default_season():
    Season = apps.get_model('server', "Season")
    try:
        season = Season.objects.get(current=True)
    except Season.DoesNotExist:
        return None
    else:
        return season


def get_default_calendar():
    season = get_default_season()
    return season.calendar if season else None


def get_default_approximate():
    season = get_default_season()
    return season.approximate_list.get(default=True) if season else None


def get_default_equipment_list():
    season = get_default_season()
    return [season.equipment_list.get(default=True)] if season else None


def get_default_fitness():
    season = get_default_season()
    return season.fitness_list.get(default=True) if season else None


def get_default_skill():
    season = get_default_season()
    return season.skill_list.get(default=True) if season else None


def get_default_state():
    season = get_default_season()
    return season.state_list.get(default=True) if season else None
