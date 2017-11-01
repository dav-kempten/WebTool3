# -*- coding: utf-8 -*-
from datetime import datetime

from django.apps import apps


def get_default_year():
    return datetime.now().year


def get_default_params():
    # JSON data as base for e.g. calculation of budget
    return dict(
        travel_cost_factor=0.07,
        accommodation_cost_default=40.00,
        youth_part_id=0,
        climbing_shool_part_id=0,
        tour_calulation=dict(
            whole_tour_day_compensation=30.00,
            half_tour_day_compensation=20.00,
            min_admission=5.00
        )
    )


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


def get_default_equipments():
    season = get_default_season()
    return season.equipment_list.filter(default=True) if season else None


def get_default_fitness():
    season = get_default_season()
    return season.fitness_list.get(default=True) if season else None


def get_default_skill():
    season = get_default_season()
    return season.skill_list.get(default=True) if season else None


def get_default_state():
    season = get_default_season()
    return season.state_list.get(default=True) if season else None
