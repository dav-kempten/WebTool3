# -*- coding: utf-8 -*-
from django.db.models import F
from django_filters import rest_framework as filters, STRICTNESS

from server.models import Event, Category, Reference, Tour, State


class ActivityFilter(filters.FilterSet):

    ACTIVITY_CHOICES = (
        ('tour', 'tour'),
        ('topic', 'topic'),
        ('collective', 'collective'),
        ('talk', 'talk')
    )

    DIVISION_CHOICES = (
        ('winter', 'winter'),
        ('summer', 'summer'),
        ('indoor', 'indoor'),
    )

    STATE_CHOICES = (
        ('done', 'done'),
        ('moved', 'moved'),
        ('canceled', 'canceled'),
        ('unfeasible', 'unfeasible'),
        ('public', 'public'),
    )

    # CATEGORY_CHOICES = [
    #    (c.lower(), c.lower()) for c in Category.objects
    #        .filter(deprecated=False, seasons__current=True)
    #        .exclude(deadline=True).exclude(preliminary=True)
    #        .order_by('code')
    #        .values_list('code', flat=True)
    # ]

    activity = filters.ChoiceFilter(label='activity', method='activity_filter', choices=ACTIVITY_CHOICES)
    division = filters.ChoiceFilter(label='division', method='division_filter', choices=DIVISION_CHOICES)
    category = filters.CharFilter(label='category', method='category_filter')  # , choices=CATEGORY_CHOICES)
    guide = filters.CharFilter(label='guide', method='guide_filter')
    month = filters.NumberFilter(label='month', method='month_filter', min_value=1, max_value=12)
    ladiesOnly = filters.BooleanFilter(label='ladiesOnly', method='ladies_only_filter')
    publicTransport = filters.BooleanFilter(label='publicTransport', method='public_transport_filter')
    lowEmissionAdventure = filters.BooleanFilter(label='lowEmissionAdventure', method='low_emission_adventure_filter')
    state = filters.ChoiceFilter(label='state', method='state_filter', choices=STATE_CHOICES)
    open =filters.BooleanFilter(label='open', method='open_filter')

    def activity_filter(self, queryset, name, value):
        if value in ("tour", "topic", "collective", "talk"):
            return queryset.filter(**{"reference__category__{}".format(value): True})

    def division_filter(self, queryset, name, value):
        if value in ("winter", "summer", "indoor"):
            return queryset.filter(**{"reference__category__{}".format(value): True})

    def category_filter(self, queryset, name, value):
        return queryset.filter(reference__category__code__iexact=value)

    def guide_filter(self, queryset, name, value):
        return queryset.filter(tour__guide__user__username__iexact=value)

    def month_filter(self, queryset, name, value):
        return queryset.filter(start_date__month=value)

    def ladies_only_filter(self, queryset, name, value):
        return queryset.filter(tour__ladies_only=value)

    def public_transport_filter(self, queryset, name, value):
        return queryset.filter(public_transport=value)

    def low_emission_adventure_filter(self, queryset, name, value):
        return queryset.filter(lea=value)

    def state_filter(self, queryset, name, value):
        return queryset.filter(**{"tour__state__{}".format(value): True})

    def open_filter(self, queryset, name, value):
        if value:
            return queryset.filter(tour__cur_quantity__lt=F('tour__max_quantity'))
        else:
            return queryset.filter(tour__cur_quantity__gte=F('tour__max_quantity'))

    class Meta:
        model = Event
        fields = (
            'activity',
            'division',
            'category',
            'guide',
            'month',
            'ladiesOnly',
            'publicTransport',
            'lowEmissionAdventure',
            'state',
            'open'
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
