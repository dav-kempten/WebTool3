# -*- coding: utf-8 -*-
import pytest
from django.db import IntegrityError, transaction

from server.models import Season


@pytest.mark.django_db
def test_a_season_can_be_created():
    """Smoke test: database reachable, migrations applied."""
    season = Season.objects.create(name='2025')
    assert Season.objects.get(pk=season.pk).name == '2025'


@pytest.mark.django_db
def test_only_one_season_can_be_current():
    """Guards the partial unique index created in migration 0002:

        CREATE UNIQUE INDEX ON "server_season" ("current") WHERE "current";

    Several places rely on Season.objects.get(current=True) not raising
    MultipleObjectsReturned, and set_current_season clears the old flag before
    setting the new one precisely because of this index.
    """
    Season.objects.create(name='2025', current=True)

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Season.objects.create(name='2026', current=True)
