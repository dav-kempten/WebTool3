# -*- coding: utf-8 -*-
"""
Trainer printouts: one tour or course as an A5 PDF in the programme booklet's
style, for the trainer to file and take out again years later.

Unlike the booklet, which shows what participants need, the printout carries
every field of the detail form, grouped by its cards, plus an internal block
with what only the office sees (message, reservation wishes, state). Empty
fields are left out, so a sparse tour stays short.
"""
import datetime
import tempfile
from decimal import Decimal

from django.template.defaultfilters import date as date_format
from django.template.defaultfilters import time as time_format

from server.latex import GRAPHICS_PATH, compile_latex, template
from server.models import Booklet

RELAX = '\\\\\\relax'


# --- formatting -------------------------------------------------------------

# Beyond Latin-1, only what the template maps with \newunicodechar or the T1
# encoding sets itself. Anything else (a "△" pasted from somewhere) would stop
# pdflatex, so it is dropped; years later a missing symbol beats no printout.
SETTABLE = set('€➚➘●○↑↓„“”‚‘’½⅓⅔¼¾–—…•△') | {chr(c) for c in range(32, 256)} | {'\n'}


def tex(value):
    text = ''.join(c for c in str(value) if c in SETTABLE)
    return Booklet.texify(text)


def paragraphs(value):
    """Free text with its line breaks: blank lines start a paragraph."""
    text = str(value or '').replace('\r\n', '\n').strip()
    if not text:
        return ''
    blocks = [tex(block).replace('\n', f'{RELAX}\n') for block in text.split('\n\n') if block.strip()]
    return '\\par\n'.join(blocks)


def url(value):
    # \url takes its argument verbatim, so only a closing brace could break it.
    return f'\\url{{{value.replace("}", "%7D")}}}' if value else ''


def euro(value):
    if value is None:
        return ''
    value = Decimal(value)
    if value == value.to_integral_value():
        return f'\\EUR{{{int(value)}}}'
    return f'\\EUR{{{value:.2f}}}'.replace('.', ',')


def amount(value, info):
    """"\\EUR{25} für Hüttenübernachtung", or '' when nothing is charged."""
    if not value:
        return ''
    return euro(value) + (f' für {tex(info)}' if info else '')


def clock(value):
    if value is None:
        return ''
    return f'{time_format(value, "G.i" if value.minute else "G")} Uhr'


def when(event):
    """Date with year plus the time span, e.g. "14. März 2027, 7 bis 18 Uhr"."""
    text = event.long_date(with_year=True)
    if event.start_time:
        start = clock(event.start_time)
        if event.end_time:
            start = f'{start.removesuffix(" Uhr")} bis {clock(event.end_time)}'
        text = f'{text}, {start}'
    elif event.approximate:
        text = f'{text}, {event.approximate.name}'
        if event.end_time:
            text = f'{text}, bis {clock(event.end_time)}'
    elif event.end_time:
        text = f'{text}, bis {clock(event.end_time)}'
    return tex(text)


def joined(items):
    return ', '.join(tex(item) for item in items if item)


def names(queryset, field='name'):
    return joined(queryset.order_by(field).values_list(field, flat=True))


def person(guide):
    return guide.name if guide else ''


# --- building blocks --------------------------------------------------------

class Sheet:
    """Collects sections; a section without a single filled field is dropped."""

    def __init__(self):
        self.parts = []
        self._fields = None

    def raw(self, text):
        if text:
            self.parts.append(text)

    def section(self, title):
        self._close()
        self._fields = (title, [])

    def field(self, label, value):
        """``value`` is TeX already (see tex(), euro(), url())."""
        if value:
            self._fields[1].append(f'\\davField{{{tex(label)}}}{{{value}}}')

    def text(self, label, value):
        """A free text under its own label, kept with its paragraphs."""
        if value and str(value).strip():
            self._fields[1].append(f'\\textbf{{{tex(label)}:}}\\par\n{paragraphs(value)}\\par')

    def _close(self):
        if self._fields and self._fields[1]:
            title, lines = self._fields
            self.parts.append(
                f'\\davSection{{{tex(title)}}}\n\\begin{{davFields}}\n'
                + '\n'.join(lines)
                + '\n\\end{davFields}'
            )
        self._fields = None

    def internal(self, render):
        """The office-only block on its grey ground."""
        self._close()
        inner = Sheet()
        render(inner)
        inner._close()
        if inner.parts:
            self.parts.append('\\begin{davInternal}\n' + '\n'.join(inner.parts) + '\n\\end{davInternal}')

    def source(self):
        self._close()
        return '\n\n'.join(self.parts)


def head(sheet, event, category, title, name, ladies_only):
    """The booklet's entry head: arrow and category, code box, date, title."""
    box = 'davReferenceLadiesOnly' if ladies_only else 'davReference'
    if category:
        sheet.raw(f'\\davCategory{{{tex(category.name)}}}\\par')
    lines = [
        f'\\{box}{{{tex(event.reference)}}}\\, {tex(event.long_date(with_year=True))}',
        f'\\davTitle{{{Booklet.to_upper(tex(title))}}}',
    ]
    # Courses often repeat their title as the long title; once is enough.
    if name and name != title:
        lines.append(f'\\davName{{{tex(name)}}}')
    sheet.raw(f'{RELAX}\n'.join(lines) + '\\par')


def travel(sheet, event, place_label):
    sheet.field('Treffpunkt', tex(event.rendezvous))
    sheet.field(place_label, tex(event.source))
    sheet.field('Übernachtungsort', tex(event.location))
    if event.distance:
        sheet.field(
            'Gesamtfahrstrecke',
            f'ca. {event.distance} km (Fahrtkostenbeteiligung ca. {euro(int(0.07 * float(event.distance)))})',
        )
    sheet.field('Anreise', joined([
        'Low Emission Adventure' if event.lea else '',
        'Gemeinschaftsanreise' if event.distal else '',
        'Öffentliche Anreise' if event.public_transport else '',
    ]))


def costs(sheet, activity):
    sheet.field('Teilnehmergebühr', euro(activity.admission) if activity.admission else '')
    sheet.field('Zusatzkosten', amount(activity.extra_charges, activity.extra_charges_info))
    sheet.field('Anzahlung', amount(activity.advances, activity.advances_info))


def quantity(activity, ladies_only):
    if not activity.max_quantity and not activity.min_quantity:
        return ''
    text = f'mindestens {activity.min_quantity}, maximal {activity.max_quantity}'
    return tex(text + (' Teilnehmerinnen' if ladies_only else ''))


def lead(sheet, activity, label):
    sheet.section('Organisation und Team')
    sheet.field(label, tex(person(activity.guide)))
    sheet.field('Team', joined(person(guide) for guide in activity.team.all()))
    sheet.field('KV-Link', url(activity.kv_link))


def remarks(sheet, activity):
    sheet.section('Bemerkungen (öffentlich)')
    sheet.text('Hinweis auf der Homepage', activity.comment)


def internal(sheet, activity, events, kind):
    def render(inner):
        inner.section('Intern – Geschäftsstelle')
        inner.text('Nachricht an die Geschäftsstelle', activity.message)
        inner.field('Reservierungswünsche', joined([
            f'Ausrüstungsbedarf {kind}' if activity.equipment_service else '',
            'Seminarraum' if any(e.reservation_service for e in events) else '',
            'Alpin-Shuttle' if any(e.shuttle_service for e in events) else '',
        ]))
        inner.field('Bearbeitungsstand beim Ausdruck', tex(activity.state.name) if activity.state else '')
        if activity.cur_quantity:
            inner.field('Anmeldungen beim Ausdruck', tex(activity.cur_quantity))
    sheet.internal(render)


def description_of(model, category):
    """
    Skill/fitness as the form shows it: the level (△ to △△△) and the text
    written for this category. 'x' means not rated and is left out.
    """
    if model is None or model.code.strip() in ('', 'x'):
        return ''
    described = model.description_list.filter(category=category).first() if category else None
    text = tex(model.code)
    if described and described.description.strip():
        text = f'{text} – {tex(described.description.strip())}'
    return text


# --- tour and course --------------------------------------------------------

def tour_source(tour):
    event = tour.tour
    category = event.reference.category
    sheet = Sheet()
    head(sheet, event, category, event.title, event.name, tour.ladies_only)
    sheet.raw(paragraphs(event.description) + '\\par' if event.description else '')

    sheet.section('Tour-Termine')
    sheet.field('Tour', when(event))
    if tour.deadline:
        sheet.field('Anmeldeschluss', tex(tour.deadline.long_date(with_year=True)))
    if tour.preliminary:
        preliminary = tour.preliminary
        sheet.field('Vorbesprechung', when(preliminary) + (f', {tex(preliminary.rendezvous)}' if preliminary.rendezvous else ''))
    sheet.field('Info', tex(tour.info))

    sheet.section('Treffpunkt und Anreise')
    travel(sheet, event, 'Ausgangsort')
    sheet.field('Tourenportal', url(event.link))
    sheet.field('Kartenausschnitt', url(str(event.map)) if event.map else '')

    sheet.section('Tourenspezifika')
    sheet.field('Merkmale', joined([
        'Touren von Frauen für Frauen' if tour.ladies_only else '',
        'Jugend on Tour' if tour.youth_on_tour else '',
        "Geh'mütlich" if tour.relaxed else '',
        'Bergbus' if tour.mountain_bus else '',
        'Übernachtungstour' if event.overnight else '',
    ]))
    extra = [c.name for c in tour.categories.order_by('order') if c.code != '?']
    if tour.categories.filter(code='?').exists() and tour.misc_category:
        extra.append(tour.misc_category)
    sheet.field('Zusatzkategorien', joined(extra))

    sheet.section('Tourenschwierigkeit')
    sheet.field('Technik', description_of(tour.skill, category))
    sheet.field('Kondition', description_of(tour.fitness, category))

    sheet.section('Anforderungen und Ausrüstung')
    sheet.field('Mindestqualifikation', names(tour.qualifications))
    sheet.text('Spezielle Voraussetzungen', tour.preconditions)
    sheet.field('Ausrüstung', names(tour.equipments))
    sheet.field('Zusätzliche Ausrüstung', tex(tour.misc_equipment))

    sheet.section('Teilnahme und Kosten')
    sheet.field('Teilnehmer*innen', quantity(tour, tour.ladies_only))
    costs(sheet, tour)

    lead(sheet, tour, 'Trainer')
    remarks(sheet, tour)
    events = [e for e in (event, tour.deadline, tour.preliminary) if e]
    internal(sheet, tour, events, 'Tour')
    return sheet.source()


def instruction_source(instruction):
    event = instruction.instruction
    topic = instruction.topic
    category = topic.category if topic else event.reference.category
    special = instruction.is_special
    meetings = list(instruction.meeting_list.filter(deprecated=False).order_by('start_date', 'start_time'))

    sheet = Sheet()
    title = event.title if special or not topic else topic.title
    name = event.name if special or not topic else topic.name
    head(sheet, event, category, title, name, instruction.ladies_only)
    if special:
        sheet.raw(paragraphs(event.description) + '\\par' if event.description else '')
    else:
        sheet.raw(paragraphs(topic.description) + '\\par' if topic and topic.description else '')

    sheet.section('Kurs-Termine')
    for index, item in enumerate([event] + meetings):
        label = 'Haupttermin' if index == 0 else f'{index + 1}. Termin'
        line = when(item)
        if item.title and (index > 0 or special):
            line = f'{line} – {tex(item.title)}'
        if item.name and index > 0:
            line = f'{line}, {tex(item.name)}'
        sheet.field(label, line)
        if index > 0:
            sheet.field('Ort', joined([item.rendezvous, item.source, item.location]))

    sheet.section('Treffpunkt und Anreise')
    travel(sheet, event, 'Kursort')

    sheet.section('Kursspezifika')
    sheet.field('Thema', tex(topic.name) if topic else '')
    sheet.field('Merkmale', joined([
        'Kurs von Frauen für Frauen' if instruction.ladies_only else '',
        'Sonderkurs' if special else '',
        'Kurs mit Übernachtung' if event.overnight else '',
    ]))
    sheet.field('Zusatzkategorie', tex(instruction.category.name) if instruction.category else '')
    if not special:
        sheet.text('Ergänzung zur Beschreibung', event.description)

    if topic and not special:
        sheet.section('Kursdetails aus dem Kursthema')
        sheet.field('Mindestqualifikation', names(topic.qualifications))
        sheet.text('Zusätzliche Anforderungen', topic.preconditions)
        sheet.field('Ausrüstung', names(topic.equipments))
        sheet.field('Zusatzausrüstung', tex(topic.misc_equipment))

    sheet.section('Anforderungen und Ausrüstung')
    sheet.field('Mindestqualifikation', names(instruction.qualifications))
    sheet.text('Spezielle Voraussetzungen', instruction.preconditions)
    sheet.field('Ausrüstung', names(instruction.equipments))
    sheet.field('Zusätzliche Ausrüstung', tex(instruction.misc_equipment))

    sheet.section('Teilnahme und Kosten')
    sheet.field('Teilnehmer*innen', quantity(instruction, instruction.ladies_only))
    costs(sheet, instruction)

    lead(sheet, instruction, 'Kursleitung')
    remarks(sheet, instruction)
    internal(sheet, instruction, [event] + meetings, 'Kurs')
    return sheet.source()


# --- document ---------------------------------------------------------------

def document(content, printed=None):
    printed = printed or datetime.date.today()
    line = f'Ausgedruckt am {date_format(printed, "j. F Y")} aus dem WebTool der DAV-Sektion Allgäu-Kempten'
    return (
        template('printout.tex')
        .replace('%%GraphicsPath%%', f'{GRAPHICS_PATH}/')
        .replace('%%Printed%%', tex(line))
        .replace('%%Content%%', content)
    )


def render_pdf(source):
    """The PDF as bytes, or None if LaTeX failed (its errors are printed)."""
    with tempfile.TemporaryDirectory() as tempdir:
        pdf = compile_latex(tempdir, 'printout', source, runs=2, check_exit=True)
        if pdf is None:
            return None
        with open(pdf, 'rb') as f:
            return f.read()


def tour_pdf(tour):
    return render_pdf(document(tour_source(tour)))


def instruction_pdf(instruction):
    return render_pdf(document(instruction_source(instruction)))


def download(pdf, event):
    """
    The PDF as an attachment named after the booking code and the date, e.g.
    "BGT-117_2021-07-07.pdf", or a 503 if LaTeX failed (logged by compile_latex).
    """
    from django.http import HttpResponse, JsonResponse

    if pdf is None:
        return JsonResponse({'detail': 'Der Ausdruck konnte nicht erzeugt werden.'}, status=503)
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{event.reference}_{event.start_date:%Y-%m-%d}.pdf"'
    response['Cache-Control'] = 'no-store'
    return response
