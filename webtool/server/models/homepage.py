# -*- coding: utf-8 -*-
"""
Bausteine für die Homepage-Texte (``details()``) von Touren, Kursen und
Gruppenterminen.

Alles, was aus dem Formular kommt, geht durch eine der beiden Funktionen:

- ``text()`` für einzeilige Felder (Titel, Orte, Infotexte, Namen). Sie werden
  vollständig escapt, ein ``<`` oder ``&`` erscheint also als Zeichen.
- ``rich()`` für Beschreibungen. Dort schreiben Trainer und Geschäftsstelle seit
  Jahren bewusst einfaches HTML (``<br />``, ``<b>``, Links, Listen). Diese Tags
  bleiben erhalten, alles andere — Skripte, Event-Attribute, ``javascript:``-
  Links, unbekannte Tags — wird entfernt.
"""
import nh3
from django.utils.html import escape

#: Die Tags, die in Beschreibungen tatsächlich vorkommen, plus ihre nächsten Verwandten.
RICH_TAGS = {'a', 'b', 'br', 'em', 'i', 'li', 'ol', 'p', 'strong', 'u', 'ul'}
RICH_ATTRIBUTES = {'a': {'href', 'title'}}
RICH_URL_SCHEMES = {'http', 'https', 'mailto'}

CONDITIONS = (
    '<p>Es gelten unsere '
    '<a href="/aktivitaeten/teilnahmebedingungen/" '
    'title="Teilnahmebedingungen">Teilnahme-</a>'
    ' und '
    '<a href="/aktivitaeten/stornobedingungen/" '
    'title="Stornobedingungen">Stornobedingungen</a>.'
    '</p>'
)

QUESTIONS = (
    '<p><strong>Fragen:</strong> Spezielle Fragen zu Touren & Kursen kannst du unter '
    '<strong>kurse@dav-kempten.de</strong> stellen. Bitte gib hierbei immer den '
    '<strong>Buchungscode</strong> der entsprechenden Veranstaltung mit an.</p>'
)


def text(value):
    """Einzeiliges Feld als HTML-Text."""
    return escape(value or '')


def rich(value):
    """Beschreibung mit den erlaubten Tags; alles andere wird entfernt."""
    return nh3.clean(
        value or '',
        tags=RICH_TAGS,
        attributes=RICH_ATTRIBUTES,
        url_schemes=RICH_URL_SCHEMES,
        link_rel=None,
    )


def line(label, value):
    """Eine beschriftete Zeile; ``value`` muss schon HTML sein (text()/rich())."""
    return '<strong>{}:</strong> {}'.format(label, value)


def qualifications(names, subject):
    """
    Hinweis auf vorausgesetzte Kursinhalte.

    :param names: Namen der Kursinhalte
    :param subject: "diesem Kurs" oder "dieser Tour"
    """
    return (
        '<div class="additional">'
        '<p>Für die Teilnahme an {} ist die Beherrschung folgender '
        'Kursinhalte Voraussetzung: <b>{}</b>. Die entsprechenden Kurse mit verwandten '
        'Kursinhalten müssen nicht in unserer Sektion absolviert worden sein.</p>'
        '</div>'
    ).format(subject, text(', '.join(names)))


def costs(activity, event, always_admission):
    """
    Anzahlung, Teilnahmegebühr, Zusatzkosten und Fahrtkostenbeteiligung.

    :param activity: Tour oder Instruction (Beträge und Infotexte)
    :param event: der Haupttermin (Fahrstrecke)
    :param always_admission: True nennt die Gebühr auch, wenn sie 0 € ist
        (Touren); Kurse lassen sie dann weg.
    """
    lines = []
    if activity.advances:
        lines.append(line('Anzahlung', '{} €{}'.format(
            int(activity.advances),
            ' für {}'.format(text(activity.advances_info)) if activity.advances_info else '',
        )))
    if always_admission or activity.admission > 0:
        lines.append(line('Teilnahmegebühr', '{} €'.format(int(activity.admission))))
    if activity.extra_charges:
        lines.append(line('Zusatzkosten', '{} €{}'.format(
            activity.extra_charges,
            ' für {}'.format(text(activity.extra_charges_info)) if activity.extra_charges_info else '',
        )))
    if event.distance:
        lines.append(line('Fahrtkostenbeteiligung', 'ca. {} € für ungefähr {} km'.format(
            int(0.07 * float(event.distance)), event.distance,
        )))
    return lines


def paragraph(lines):
    """Zeilen als ein Absatz, getrennt durch Zeilenumbrüche."""
    return '<p>{}</p>'.format('<br />'.join(lines))
