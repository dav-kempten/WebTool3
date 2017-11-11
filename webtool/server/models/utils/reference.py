# -*- coding: utf-8 -*-
from server.models import Category, defaults, Reference, Season

REFERENCE_RANGE = set(range(1, 100))


def create_reference(category=None, prefix=None, season=None, **kwargs):

    reference = None
    if isinstance(season, str):
        try:
            season = Season.objects.get(name=season)
        except Season.DoesNotExist:
            print('Season "{}" nicht gefunden'.format(season))
            return None

    if season is None:
        season = defaults.get_default_season()

    if isinstance(category, str):
        try:
            category = Category.objects.get(code=category, seasons=season, **kwargs)
        except Category.DoesNotExist:
            print('Category "{}" nicht gefunden'.format(category))
            return None

    if category is None:
        category = Category.objects.filter(seasons=season, **kwargs).order_by('code').last()
        if category is None:
            print('Category "{}" nicht gefunden'.format(repr(kwargs)))
            return None

    if prefix is None:
        prefix = int(season.name[-1])

    cur_references = set(Reference.objects.filter(category=category, prefix=prefix, season=season).values_list('reference', flat=True))
    free_references = REFERENCE_RANGE - cur_references
    if free_references:
        reference = Reference.objects.create(season=season, category=category, prefix=prefix, reference=min(free_references))
    if reference is None:
        category_code = category.code
        category_index = category_code[-1]
        if category_index < "0" or category_index > "9":
            print('Category "{}" hat keinen Zähler'.format(category_code))
            return None
        category.pk = None
        category_index = int(category_index) + 1
        category.code = "{}{:1d}".format(category_code[:2], category_index)
        category.save()
        category.seasons.add(season)
        reference = create_reference(category=category, prefix=prefix, season=season, **kwargs)
    return reference


def delete_reference(reference):
    if isinstance(reference, str):
        reference = Reference.get_reference(reference)
    event = reference.event
    if hasattr(event, 'tour') and event.tour:
        tour = event.tour
        deadline = tour.deadline
        deadline_reference = deadline.reference
        preliminary = None
        preliminary_reference = None
        if hasattr(tour, 'preliminary') and tour.preliminary:
            preliminary = tour.preliminary
            preliminary_reference = preliminary.reference
        n = tour.delete()
        if n[0] > 0:
            print("Tour {} gelöscht".format(tour.tour.reference), end='')
        n = deadline.delete()
        if n[0] > 0:
            print(", Anmeldeschluss {} gelöscht".format(deadline_reference), end='')
        n = deadline_reference.delete()
        if n[0] > 0:
            print(", Buchugscode für Anmeldeschluss {} gelöscht".format(deadline_reference), end='')
        if preliminary:
            n = preliminary.delete()
            if n[0] > 0:
                print(" Vorbesprechung {} gelöscht".format(preliminary_reference), end='')
            n = preliminary_reference.delete()
            if n[0] > 0:
                print(" Buchungscode für Vorbesprechung {} gelöscht".format(preliminary_reference), end='')
    n = event.delete()
    if n[0] > 0:
        print(", Termin {} gelöscht".format(event.reference), end='')
    n = reference.delete()
    if n[0] > 0:
        print(", Buchungscode {} gelöscht".format(reference), end='')
    print()
