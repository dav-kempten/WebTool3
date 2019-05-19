# -*- coding: utf-8 -*-
import hashlib
from decimal import Decimal

from django.template.defaultfilters import date

from rest_framework import viewsets
from rest_framework.response import Response

from server.models import (
    Season, State, Category, Approximate, Equipment,
    Skill, SkillDescription,
    Fitness, FitnessDescription,
    Topic,
    Collective)

from server.serializers.frontend.values import ValueSerializer


class _Values(object):

    def __init__(self, season):
        self._season = season
        self._updated = season.updated

        self.states = self._get_states()
        self.categories = self._get_categories()
        self.approximates = self._get_approximates()
        self.equipments = self._get_equipments()
        self.skills = self._get_skills()
        self.fitness = self._get_fitness()
        self.topics = self._get_topics()
        self.collectives = self._get_collectives()
        self.travel_cost_factor = Decimal('0.07')
        self.max_accommodation = Decimal('40.00')
        self.accommodation = Decimal('20.00')
        self.tour_calculation = self._get_tour_data()
        self.instruction_calculation = None

    def _get_states(self):
        self._updated = max(self._updated, State.objects.latest().updated)
        return [
            dict(id=x, state=y, description=z)
            for (x, y, z) in State.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .order_by('order')
            .values_list('pk', 'name', 'description')
        ]

    def _get_categories(self):
        self._updated = max(self._updated, Category.objects.latest().updated)
        return [
            dict(id=a, code=b, name=c, tour=d, talk=e, instruction=f, collective=g, winter=h, summer=i, indoor=j)
            for (a, b, c, d, e, f, g, h, i, j) in Category.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .exclude(deadline=True)
            .exclude(preliminary=True)
            .exclude(meeting=True)
            .values_list('pk', 'code', 'name', 'tour', 'talk', 'topic', 'collective', 'winter', 'summer', 'climbing')
        ]

    def _get_approximates(self):
        self._updated = max(self._updated, Approximate.objects.latest().updated)
        return [
            dict(id=a, name=b, description=c, start_time=d)
            for (a, b, c, d) in Approximate.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .order_by('start_time')
            .values_list('pk', 'name', 'description', 'start_time')
        ]

    def _get_equipments(self):
        self._updated = max(self._updated, Equipment.objects.latest().updated)
        return [
            dict(id=a, code=b, name=c, description=d)
            for (a, b, c, d) in Equipment.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .order_by('code')
            .values_list('pk', 'code', 'name', 'description')
        ]

    def _get_skills(self):
        self._updated = max(self._updated, Skill.objects.latest().updated)
        return [
            dict(id=a, level=None if b == 'x' else len(b), categoryId=c, code=d, description=e)
            for (a, b, c, d, e) in SkillDescription.objects
            .exclude(deprecated=True)
            .filter(skill__seasons=self._season)
            .values_list('pk', 'skill__code', 'category_id', 'category__code', 'description')
        ]

    def _get_fitness(self):
        self._updated = max(self._updated, Fitness.objects.latest().updated)
        return [
            dict(id=a, level=None if b == 'x' else len(b), categoryId=c, code=d, description=e)
            for (a, b, c, d, e) in FitnessDescription.objects
            .exclude(deprecated=True)
            .filter(fitness__seasons=self._season)
            .values_list('pk', 'fitness__code', 'category_id', 'category__code', 'description')
        ]

    def _get_topics(self):
        self._updated = max(self._updated, Topic.objects.latest().updated)
        return [
            dict(id=a, code=b, title=c, name=d, description=e)
            for (a, b, c, d, e) in Topic.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .values_list('pk', 'category__code', 'title', 'name', 'description')
        ]

    def _get_collectives(self):
        self._updated = max(self._updated, Collective.objects.latest().updated)
        return [
            dict(id=a, code=b, title=c, name=d, description=e)
            for (a, b, c, d, e) in Collective.objects
            .exclude(deprecated=True)
            .filter(seasons=self._season)
            .values_list('pk', 'category__code', 'title', 'name', 'description')
        ]

    def _get_tour_data(self):
        return dict(
            half_day=Decimal('20.00'),
            whole_day=Decimal('30.00'),
            min_admission=Decimal('5.00')
        )

    def get_etag(self):
        etag = "{}".format(self._updated).encode()
        return hashlib.md5(etag).hexdigest()

    @property
    def updated(self):
        return self._updated


class ValuesViewSet(viewsets.mixins.ListModelMixin, viewsets.GenericViewSet):

    def list(self, request, *args, **kwargs):

        instance = _Values(Season.objects.get(current=True))
        serializer = ValueSerializer(instance)
        response = Response(serializer.data)

        response['Cache-Control'] = "public, max-age=86400"
        response['ETag'] = '"{}"'.format(instance.get_etag())
        response['Last-Modified'] = "{} GMT".format(date(instance.updated, "D, d M Y H:i:s"))
        return response
