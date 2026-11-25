# -*- coding: utf-8 -*-
"""Bearbeitungssperre für Trainer.

Trainer bearbeiten ihre Touren, Kurse und Gruppentermine nur im Status
"In Arbeit". Mit "Fertig" geben sie den Termin an die Geschäftsstelle ab, ab
dann ändert nur noch das Personal (is_staff) daran. Solange der Termin
"Fertig" ist, also noch nicht geprüft, holen sie ihn mit reopen() zurück.

Die Status werden über das Flag `default` bzw. den Namen erkannt, nicht über
feste Primärschlüssel: die stimmen nur in der Produktionsdatenbank zufällig mit
der Reihenfolge überein.
"""
from rest_framework.exceptions import PermissionDenied, ValidationError

from server.models import State

LOCKED_MESSAGE = (
    'Trainer können nur Termine im Status „In Arbeit“ bearbeiten. '
    'Danach übernimmt die Geschäftsstelle.'
)


def in_progress(state):
    """True für den Status "In Arbeit"."""
    return state is not None and state.default


def is_ready(state):
    """True für den Status "Fertig": abgegeben, aber noch nicht geprüft."""
    return state is not None and state.name == 'Fertig'


def reopen(request, obj, owner):
    """
    Setzt einen Termin von "Fertig" zurück auf "In Arbeit", sonst nichts --
    die übrigen Felder bleiben, wie sie sind. ``owner`` sagt, ob der Benutzer
    den Termin leitet; das Personal darf es immer. Ab "Freigegeben" hat die
    Geschäftsstelle den Termin übernommen, dann geht es nicht mehr zurück.
    """
    if not (owner or request.user.is_staff):
        raise PermissionDenied('Nur die Leitung des Termins kann ihn wieder bearbeiten.')
    if not is_ready(obj.state):
        raise ValidationError({'stateId': 'Nur Termine im Status „Fertig“ können wieder bearbeitet werden.'})
    obj.state = State.objects.get(default=True)
    obj.save()
    return obj


def _data(request):
    return request.data if isinstance(request.data, dict) else {}


def _requested_state(request):
    """Der Status, den die Anfrage setzen will; None ohne Angabe, False bei Unsinn."""
    data = _data(request)
    if 'stateId' not in data:
        return None
    try:
        return State.objects.get(pk=int(data['stateId']))
    except (TypeError, ValueError, State.DoesNotExist):
        return False


def guide_may_set_state(request):
    """Ein Trainer darf "In Arbeit" lassen oder an die Geschäftsstelle abgeben ("Fertig")."""
    state = _requested_state(request)
    if state is None:
        return True
    return bool(state) and (state.default or state.name == 'Fertig')


def guide_may_create_with_state(request):
    """Neue Termine eines Trainers beginnen immer "In Arbeit"."""
    state = _requested_state(request)
    return state is None or (bool(state) and state.default)


def refuse_upsert(request):
    """
    Ein POST legt nur neu an, für alle, auch für das Personal. Die Serializer
    haben ein POST mit der Id eines bestehenden Termins früher als Update
    ausgeführt -- an der Objektprüfung (Eigentümer, Status) vorbei, sodass ein
    Trainer gesperrte und sogar fremde Termine ändern konnte. Geändert wird nur
    per PUT auf den Termin selbst.
    """
    if request.method == 'POST' and _data(request).get('id') not in (None, '', 0):
        raise PermissionDenied('Bestehende Termine werden per PUT geändert, nicht per POST.')
