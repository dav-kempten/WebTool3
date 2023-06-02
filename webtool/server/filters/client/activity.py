# -*- coding: utf-8 -*-
import datetime
from django.db.models import F, Q
from django_filters import rest_framework as filters

from server.models import Event, Category, Reference, Tour, State, Guide, CategoryGroup


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
    group = filters.NumberFilter(label='group', method='categorygroup_filter')
    guide = filters.CharFilter(label='guide', method='guide_filter')
    team = filters.CharFilter(label='team', method='team_filter')
    month = filters.NumberFilter(label='month', method='month_filter', min_value=1, max_value=12)
    ladiesOnly = filters.BooleanFilter(label='ladiesOnly', method='ladies_only_filter')
    youthOnTour = filters.BooleanFilter(label="youthOnTour", method='youth_on_tour')
    relaxed = filters.BooleanFilter(label='relaxed', method='relaxed_filter')
    mountainBus = filters.BooleanFilter(label='mountainBus', method='mountainbus_filter')
    publicTransport = filters.BooleanFilter(label='publicTransport', method='public_transport_filter')
    lowEmissionAdventure = filters.BooleanFilter(label='lowEmissionAdventure', method='low_emission_adventure_filter')
    state = filters.ChoiceFilter(label='state', method='state_filter', choices=STATE_CHOICES)
    open = filters.BooleanFilter(label='open', method='open_filter')
    next = filters.NumberFilter(label='next', method='next_filter', min_value=1, max_value=10)

    def activity_filter(self, queryset, name, value):
        if value in ("tour", "topic", "collective", "talk"):
            return queryset.filter(**{"reference__category__{}".format(value): True}).exclude(deprecated=True)
        else:
            Event.objects.none()

    def division_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
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
        queryset = queryset.exclude(deprecated=True)
        try:
            category = Category.objects.get(code__iexact=value)
        except Category.DoesNotExist:
            return Event.objects.none()
        return queryset.filter(
            Q(reference__category=category) |
            Q(tour__categories=category) |
            Q(meeting__category=category)
        ).distinct()


    def categorygroup_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
        try:
            group = CategoryGroup.objects.get(pk=value)
        except CategoryGroup.DoesNotExist:
            return Event.objects.none()
        return queryset.filter(
            Q(reference__category__in=group.categories.all()) |
            Q(meeting__category__in=group.categories.all())
        ).distinct()

    def guide_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
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
        queryset = queryset.exclude(deprecated=True)
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
        queryset = queryset.exclude(deprecated=True)
        if 1 <= value <= 12:
            today = datetime.date.today()
            this_year = today.year
            this_moth = today.month
            if this_moth == 12 and value == 1:
                this_year = this_year + 1
            return queryset.filter(start_date__month=value, start_date__year=this_year)
        else:
            Event.objects.none()

    def ladies_only_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
        if value:
            return queryset.filter(
                Q(tour__ladies_only=True) |
                Q(meeting__ladies_only=True) |
                Q(session__ladies_only=True)
            ).distinct()
        else:
            return queryset.exclude(tour__ladies_only=True).exclude(meeting__ladies_only=True).exclude(session__ladies_only=True)

    def youth_on_tour(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
        if value:
            return queryset.filter(tour__youth_on_tour=True)
        else:
            return queryset.exclude(tour__youth_on_tour=True)

    def public_transport_filter(self, queryset, name, value):
        return queryset.filter(public_transport=value).exclude(deprecated=True)

    def relaxed_filter(self, queryset, name, value):
        return queryset.filter(tour__relaxed=value).exclude(deprecated=True)

    def mountainbus_filter(self, queryset, name, value):
        return queryset.filter(tour__mountain_bus=value).exclude(deprecated=True)

    def low_emission_adventure_filter(self, queryset, name, value):
        return queryset.filter(lea=value).exclude(deprecated=True)

    def state_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
        if value == "public":
            try:
                public = State.objects.get(done=False, moved=False, canceled=False, unfeasible=False, public=True)
            except State.DoesNotExist:
                return Event.objects.none()
            return queryset.filter(
                Q(tour__state=public) |
                Q(meeting__state=public) |
                Q(session__state=public) |
                Q(talk__state=public)
            ).distinct()
        elif value in ("done", "moved", "canceled", "unfeasible"):
            return queryset.filter(
                Q(**{"tour__state__{}".format(value): True}) |
                Q(**{"meeting__state__{}".format(value): True}) |
                Q(**{"session__state__{}".format(value): True}) |
                Q(**{"talk__state__{}".format(value): True})
            ).distinct()
        else:
            Event.objects.none()

    def open_filter(self, queryset, name, value):
        queryset = queryset.exclude(deprecated=True)
        if value:
            return (
                queryset
                    .exclude(tour__cur_quantity__gte=F('tour__max_quantity'))
                    .exclude(meeting__cur_quantity__gte=F('meeting__max_quantity'))
                    .exclude(talk__cur_quantity__gte=F('talk__max_quantity'))
            )
        else:
            return queryset.filter(
                Q(tour__cur_quantity__gte=F('tour__max_quantity')) |
                Q(meeting__cur_quantity__gte=F('meeting__max_quantity')) |
                Q(talk__cur_quantity__gte=F('talk__max_quantity'))
            ).distinct()

    def next_filter(self, queryset, name, value):
        queryset = queryset.exclude(
            deprecated=True
        ).exclude(
            tour__state__canceled=True
        ).exclude(
            meeting__state__canceled=True
        ).exclude(
            talk__state__canceled=True
        ).exclude(
            session__state__canceled=True
        )
        today = datetime.date.today()
        q1 = (
            queryset
                .filter(start_date__gte=today).exclude(session__isnull=False)
        )
        q2 = queryset.filter(start_date__gte=today, reference__category__code__in=['VST', 'SKA', 'AAS', "EVT"])
        return q1.union(q2).order_by('start_date')

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
            'relaxed',
            'mountainBus',
            'state',
            'open',
            'next'
        )
