# -*- coding: utf-8 -*-
import pytest

from server.models import Category, Reference, ReferenceSpaceExhausted


def fill(season, category, skip=None):
    """Occupy all 990 slots of one (season, category), optionally leaving one free."""
    Reference.objects.bulk_create([
        Reference(season=season, category=category, prefix=p, reference=r)
        for p in range(10)
        for r in range(1, 100)
        if (p, r) != skip
    ])


@pytest.mark.django_db
def test_create_reference_uses_the_last_free_slot(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category, skip=(7, 42))

    created = Reference.create_reference(category=category, prefix=5, season=season)

    assert (created.prefix, created.reference) == (7, 42)


@pytest.mark.django_db
def test_create_reference_raises_when_every_slot_is_taken(make_season, make_category):
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted) as excinfo:
        Reference.create_reference(category=category, prefix=5, season=season)

    assert 'KT1' in str(excinfo.value)
    assert '2025' in str(excinfo.value)
    assert excinfo.value.category == category
    assert excinfo.value.season == season


@pytest.mark.django_db
def test_a_full_category_is_not_cloned(make_season, make_category):
    """The old escape hatch invented a new category code from an internal
    counter. For KT1 it would have created KT2, for KT9 a four character code
    the column cannot hold."""
    season = make_season('2025', current=True)
    category = make_category('KT1')
    fill(season, category)

    with pytest.raises(ReferenceSpaceExhausted):
        Reference.create_reference(category=category, prefix=5, season=season)

    assert Category.objects.count() == 1
    assert not Category.objects.filter(code='KT2').exists()
