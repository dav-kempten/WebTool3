from django.core.management import BaseCommand

from server.models import Season

# Import models with SeasonsMixin
from server.models import Approximate, Category, CategoryGroup, Collective, Equipment, Fitness, Guide, Topic
from server.models import Part, Skill, State


def update_approximate(season=None):
    for el in Approximate.objects.all():
        el.seasons.add(season)
        el.save()


def update_category(season=None):
    for el in Category.objects.all():
        el.seasons.add(season)
        el.save()


def update_categorygroup(season=None):
    for el in CategoryGroup.objects.all():
        el.seasons.add(season)
        el.save()


def update_collective(season=None):
    for el in Collective.objects.all():
        el.seasons.add(season)
        el.save()


def update_equipment(season=None):
    for el in Equipment.objects.all():
        el.seasons.add(season)
        el.save()


def update_fitness(season=None):
    for el in Fitness.objects.all():
        el.seasons.add(season)
        el.save()


def update_guide(season=None):
    for el in Guide.objects.all():
        el.seasons.add(season)
        el.save()


def update_topic(season=None):
    for el in Topic.objects.all():
        el.seasons.add(season)
        el.save()


def update_part(season=None):
    for el in Part.objects.all():
        el.seasons.add(season)
        el.save()


def update_skill(season=None):
    for el in Skill.objects.all():
        el.seasons.add(season)
        el.save()


def update_state(season=None):
    for el in State.objects.all():
        el.seasons.add(season)
        el.save()


class Command(BaseCommand):

    help = 'Update all models with new season'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)

    def add_arguments(self, parser):
        parser.add_argument('season', type=int, help='Year, which you want to update your models')

    def handle(self, *args, **kwargs):
        season = Season.objects.get(name=kwargs['season'])
        # Update all models to new season
        update_approximate(season)
        update_category(season)
        update_categorygroup(season)
        update_collective(season)
        update_equipment(season)
        update_fitness(season)
        update_guide(season)
        update_topic(season)
        update_part(season)
        update_skill(season)
        update_state(season)
