# -*- coding: utf-8 -*-
from django.db.models import F, Q
from django_filters import rest_framework as filters, STRICTNESS

from server.models import Event, Category, Reference, Tour, State, Guide


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
        ('misc', 'misc'),
    )

    STATE_CHOICES = (
        ('done', 'done'),
        ('moved', 'moved'),
        ('canceled', 'canceled'),
        ('unfeasible', 'unfeasible'),
        ('public', 'public'),
        ('published', 'published'),
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
    category = filters.CharFilter(label='category', method='category_filter', max_length=3, min_length=3)  # , choices=CATEGORY_CHOICES)
    guide = filters.CharFilter(label='guide', method='guide_filter')
    team = filters.CharFilter(label='team', method='team_filter')
    month = filters.NumberFilter(label='month', method='month_filter', min_value=1, max_value=12)
    ladiesOnly = filters.BooleanFilter(label='ladiesOnly', method='ladies_only_filter')
    publicTransport = filters.BooleanFilter(label='publicTransport', method='public_transport_filter')
    lowEmissionAdventure = filters.BooleanFilter(label='lowEmissionAdventure', method='low_emission_adventure_filter')
    state = filters.ChoiceFilter(label='state', method='state_filter', choices=STATE_CHOICES)
    open =filters.BooleanFilter(label='open', method='open_filter')

    def activity_filter(self, queryset, name, value):
        if value in ("tour", "topic", "collective", "talk"):
            return queryset.filter(**{"reference__category__{}".format(value): True})
        else:
            Event.objects.none()

    def division_filter(self, queryset, name, value):
        if value in ("winter", "summer"):
            return queryset.filter(**{"reference__category__{}".format(value): True})
        elif value == "indoor":
            return queryset.filter(reference__category__climbing=True)
        elif value == "misc":
            return queryset.filter(
                reference__category__winter=False,
                reference__category__summer=False,
                reference__category__climbing=False,
            )
        else:
            Event.objects.none()

    def category_filter(self, queryset, name, value):
        return queryset.filter(
            Q(reference__category__code__iexact=value) |
            Q(tour__categories__code__iexact=value)
        ).distinct()

    def guide_filter(self, queryset, name, value):
        try:
            guide = Guide.objects.get(user__username__iexact=value)
        except Guide.DoesNotExist:
            return Event.objects.none()
        return queryset.filter(
            Q(tour__guide=guide) |
            Q(meeting__guide=guide) |
            Q(session__guide=guide)
        ).distinct()

    def team_filter(self, queryset, name, value):
        try:
            guide = Guide.objects.get(user__username__iexact=value)
        except Guide.DoesNotExist:
            return Event.objects.none()
        return queryset.filter(
            Q(tour__team=guide) |
            Q(meeting__team=guide) |
            Q(session__team=guide)
        ).distinct()

    def month_filter(self, queryset, name, value):
        return queryset.filter(start_date__month=value)

    def ladies_only_filter(self, queryset, name, value):
        return queryset.filter(
            Q(tour__ladies_only=value) |
            Q(meeting__ladies_only=value)
        ).distinct()

    def public_transport_filter(self, queryset, name, value):
        return queryset.filter(public_transport=value)

    def low_emission_adventure_filter(self, queryset, name, value):
        return queryset.filter(lea=value)

    def state_filter(self, queryset, name, value):
        if value == "published":
            published = State.objects.get(done=False, moved=False, canceled=False, unfeasible=False, public=True)
            return queryset.filter(
                Q(tour__state=published) |
                Q(meeting__state=published) |
                Q(session__state=published) |
                Q(talk__state=published)
            ).distinct()
        elif value in ("done", "moved", "canceled", "unfeasible", "public"):
            return queryset.filter(
                Q(**{"tour__state__{}".format(value): True}) |
                Q(**{"meeting__state__{}".format(value): True}) |
                Q(**{"session__state__{}".format(value): True}) |
                Q(**{"talk__state__{}".format(value): True})
            ).distinct()
        else:
            Event.objects.none()

    def open_filter(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(tour__cur_quantity__lt=F('tour__max_quantity')) |
                Q(meeting__cur_quantity__lt=F('meeting__max_quantity')) |
                Q(talk__cur_quantity__lt=F('talk__max_quantity'))
            ).distinct()
        else:
            return queryset.filter(
                Q(tour__cur_quantity__gte=F('tour__max_quantity')) |
                Q(meeting__cur_quantity__gte=F('meeting__max_quantity')) |
                Q(talk__cur_quantity__gte=F('talk__max_quantity'))
            ).distinct()

    class Meta:
        model = Event
        fields = (
            'activity',
            'division',
            'category',
            'guide',
            'team',
            'month',
            'ladiesOnly',
            'publicTransport',
            'lowEmissionAdventure',
            'state',
            'open'
        )
        strict = STRICTNESS.RAISE_VALIDATION_ERROR
