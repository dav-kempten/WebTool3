# -*- coding: utf-8 -*-
"""
Abrechnung eines Trainers für eine Tour oder einen Kurs, nach dem
Abrechnungsleitfaden der Sektion (Stand August 2025) und im Aufbau des
Formulars "Abrechnung" (Version 1/2026).

Das WebTool speichert dabei nichts: ``defaults()`` liefert die Vorbelegung aus
den Daten der Veranstaltung, der Trainer korrigiert sie im Dialog (Stunden,
km, Übernachtungen, Belege …), ``compute()`` rechnet daraus die Positionen, und
``claim_pdf()`` setzt sie als PDF zum Unterschreiben.

Die Sätze stehen bewusst hier und nicht in der Datenbank: Sie ändern sich nur
mit einem neuen Leitfaden bzw. Formular, und dann ist auch dieser Text zu prüfen.
"""
import datetime
import re
from collections import Counter
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal

from django.template.defaultfilters import date as date_format
from rest_framework import serializers

LEITFADEN = 'Abrechnungsleitfaden der Sektion, Stand August 2025; Formular Version 1/2026'

# --- Sätze ------------------------------------------------------------------

#: Tourenbetrieb: Tagespauschale bis 6 Stunden / ab 6 Stunden.
TOUR_SHORT = Decimal('25')
TOUR_LONG = Decimal('40')

#: Ausbildung nach Kategorie: Stundensatz bis 3 Std., Pauschale bis 6 Std.,
#: Pauschale ab 6 Std.
COURSE_RATES = {
    1: (Decimal('7'), Decimal('20'), Decimal('35')),
    2: (Decimal('9'), Decimal('30'), Decimal('55')),
    3: (Decimal('11'), Decimal('40'), Decimal('70')),
    4: (Decimal('13'), Decimal('50'), Decimal('85')),
}
LEVEL_ROMAN = {1: 'I', 2: 'II', 3: 'III', 4: 'IV'}
LEVEL_NAMES = {
    1: 'I (Helfer*innen ohne Ausbildung)',
    2: 'II (KB, FGL, WL, JL)',
    3: 'III (TC, FÜL, JL++)',
    4: 'IV (TB, BGF)',
}
#: Vorbesprechung im Ausbildungsbetrieb, pauschal.
PRELIMINARY = Decimal('10')

#: Übernachtung pauschal, mit Originalbeleg bis höchstens.
NIGHT_FLAT = Decimal('25')
NIGHT_MAX = Decimal('50')

#: Fahrtkosten je km: eigener PKW, Fahrrad, Leiter als Mitfahrer.
KM_CAR = Decimal('0.20')
KM_BIKE = Decimal('0.15')
KM_PASSENGER = Decimal('0.07')
#: Bahn/ÖPNV nach Beleg: Zuschlag mit BahnCard 25 bzw. 50.
BAHNCARD = {'none': Decimal('1'), 'bc25': Decimal('1.05'), 'bc50': Decimal('1.10')}
BAHNCARD_TEXT = {'none': '', 'bc25': ' mit BahnCard 25 × 105 %', 'bc50': ' mit BahnCard 50 × 110 %'}

SHORT_HOURS = Decimal('3')
LONG_HOURS = Decimal('6')

CENT = Decimal('0.01')

# --- Stufe aus der Qualifikation ---------------------------------------------

LEVEL_II_CODES = {'KB', 'FGL', 'WL', 'JL'}
LEVEL_IV_CODES = {'BSF'}  # Berg- und Skiführer


def qualification_level(code, group_name):
    """Kategorie I–IV einer Qualifikation (Leitfaden, Abschnitt 1, Ausbildungsbetrieb)."""
    code = (code or '').upper()
    if code.startswith('TB') or code in LEVEL_IV_CODES:
        return 4
    if code.startswith('TC') or (group_name or '').startswith('Fachübungsleiter'):
        return 3
    if code in LEVEL_II_CODES:
        return 2
    return 1


def guide_level(guide):
    """Höchste Kategorie aus den aktiven, abgeschlossenen Qualifikationen des Trainers."""
    rows = guide.user.qualification_list.filter(aspirant=False, inactive=False).values_list(
        'qualification__code', 'qualification__group__name'
    )
    return max((qualification_level(code, group) for code, group in rows), default=1)


# --- IBAN -------------------------------------------------------------------

IBAN_LENGTHS = {
    'AT': 20, 'BE': 16, 'CH': 21, 'CZ': 24, 'DE': 22, 'DK': 18, 'ES': 24, 'FI': 18, 'FR': 27,
    'GB': 22, 'HR': 21, 'HU': 28, 'IE': 22, 'IT': 27, 'LI': 21, 'LU': 20, 'NL': 18, 'NO': 15,
    'PL': 28, 'PT': 25, 'SE': 24, 'SI': 19, 'SK': 24,
}


def normalize_iban(value):
    return re.sub(r'\s+', '', value or '').upper()


def iban_valid(value):
    """Länge je Land (soweit bekannt) und Prüfsumme nach ISO 13616 (mod 97)."""
    iban = normalize_iban(value)
    if not re.fullmatch(r'[A-Z]{2}\d{2}[A-Z0-9]{10,30}', iban):
        return False
    if IBAN_LENGTHS.get(iban[:2], len(iban)) != len(iban):
        return False
    digits = ''.join(str(int(c, 36)) for c in iban[4:] + iban[:4])
    return int(digits) % 97 == 1


def format_iban(value):
    iban = normalize_iban(value)
    return ' '.join(iban[i:i + 4] for i in range(0, len(iban), 4))


# --- Berechnung --------------------------------------------------------------

def money(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def number_text(value):
    value = Decimal(value)
    text = f'{value.normalize():f}' if value != value.to_integral_value() else str(int(value))
    return text.replace('.', ',')


def euro_text(value):
    value = money(value)
    if value == value.to_integral_value():
        return f'{int(value)} €'
    return f'{value:.2f} €'.replace('.', ',')


@dataclass
class Row:
    """Eine Zeile wie im Formular: Kategorie, Satz, Anzahl, Betrag."""
    label: str
    rate: str
    quantity: str
    amount: Decimal


@dataclass
class Claim:
    kind: str  # 'tour' oder 'course'
    level: int
    #: Betrag je Tag in der Reihenfolge der Eingabe (für die Anzeige im Dialog).
    day_amounts: list = field(default_factory=list)
    night_amounts: list = field(default_factory=list)
    compensation: list = field(default_factory=list)
    travel: list = field(default_factory=list)
    expenses: list = field(default_factory=list)

    @staticmethod
    def sum(rows):
        return money(sum((row.amount for row in rows), Decimal('0')))

    @property
    def total(self):
        return money(self.sum(self.compensation) + self.sum(self.travel) + self.sum(self.expenses))


def day_category(kind, level, hours, day_kind):
    """(Kategorie, Satz, Betrag) eines Tages bzw. Termins."""
    if kind == 'course' and day_kind == 'preliminary':
        return 'preliminary', PRELIMINARY, PRELIMINARY
    if kind == 'tour':
        return ('short', TOUR_SHORT, TOUR_SHORT) if hours < LONG_HOURS else ('long', TOUR_LONG, TOUR_LONG)
    hourly, short, long = COURSE_RATES[level]
    if hours <= SHORT_HOURS:
        return 'hourly', hourly, money(hourly * hours)
    if hours < LONG_HOURS:
        return 'short', short, short
    return 'long', long, long


def compute(data):
    """Die Positionen aus den (korrigierten) Angaben des Dialogs, siehe ``ClaimInputSerializer``."""
    kind = data['kind']
    level = data.get('level') or 1
    claim = Claim(kind=kind, level=level)
    category = f'Kat. {LEVEL_ROMAN[level]}' if kind == 'course' else 'Tour'

    counts, hourly_hours, rates = Counter(), Decimal('0'), {}
    for day in data.get('days', []):
        hours = Decimal(day['hours'])
        key, rate, amount = day_category(kind, level, hours, day.get('kind', 'day'))
        claim.day_amounts.append(money(amount))
        rates[key] = rate
        if key == 'hourly':
            hourly_hours += hours
        else:
            counts[key] += 1

    if counts['long']:
        claim.compensation.append(Row(f'{category} ab 6 Std.', euro_text(rates['long']), str(counts['long']),
                                      money(rates['long'] * counts['long'])))
    if counts['short']:
        claim.compensation.append(Row(f'{category} bis 6 Std.', euro_text(rates['short']), str(counts['short']),
                                      money(rates['short'] * counts['short'])))
    if hourly_hours:
        claim.compensation.append(Row(f'{category} bis 3 Std.', f'{euro_text(rates["hourly"])}/Std.',
                                      f'{number_text(hourly_hours)} Std.', money(rates['hourly'] * hourly_hours)))
    if counts['preliminary']:
        claim.compensation.append(Row('Vorbesprechung', euro_text(PRELIMINARY), str(counts['preliminary']),
                                      money(PRELIMINARY * counts['preliminary'])))

    flat_nights = 0
    for night in data.get('nights', []):
        receipt = night.get('receipt')
        if receipt is None:
            flat_nights += 1
            claim.night_amounts.append(money(NIGHT_FLAT))
        else:
            amount = min(money(receipt), NIGHT_MAX)
            claim.night_amounts.append(amount)
            note = f', max. {euro_text(NIGHT_MAX)}' if receipt > NIGHT_MAX else ''
            claim.compensation.append(Row('Nacht lt. Beleg', f'{euro_text(receipt)}{note}', '1', amount))
    if flat_nights:
        claim.compensation.append(Row('Nacht pauschal', euro_text(NIGHT_FLAT), str(flat_nights),
                                      money(NIGHT_FLAT * flat_nights)))

    for label, km, rate in (
        ('PKW', data.get('carKm'), KM_CAR),
        ('Fahrrad', data.get('bikeKm'), KM_BIKE),
        ('Leiter als Mitfahrer', data.get('passengerKm'), KM_PASSENGER),
    ):
        if km:
            claim.travel.append(Row(label, f'{euro_text(rate)}/km', f'{km} km',
                                    money(rate * km)))
    ticket = data.get('publicTransport')
    if ticket:
        bahncard = data.get('bahncard') or 'none'
        claim.travel.append(Row(f'Bahn/ÖPNV nach Beleg{BAHNCARD_TEXT[bahncard]}', euro_text(ticket), '1',
                                money(Decimal(ticket) * BAHNCARD[bahncard])))

    for expense in data.get('expenses', []):
        if expense.get('label') or expense.get('amount'):
            claim.expenses.append(Row(expense.get('label') or 'Auslage', 'nach Beleg', '1',
                                      money(expense.get('amount') or 0)))
    return claim


def claim_json(claim):
    def rows(part):
        return [dict(label=r.label, rate=r.rate, quantity=r.quantity, amount=str(r.amount)) for r in part]

    return dict(
        dayAmounts=[str(a) for a in claim.day_amounts],
        nightAmounts=[str(a) for a in claim.night_amounts],
        compensation=rows(claim.compensation),
        travel=rows(claim.travel),
        expenses=rows(claim.expenses),
        subtotals=dict(
            compensation=str(Claim.sum(claim.compensation)),
            travel=str(Claim.sum(claim.travel)),
            expenses=str(Claim.sum(claim.expenses)),
        ),
        total=str(claim.total),
    )


# --- Vorbelegung aus den Daten der Veranstaltung ------------------------------

#: Annahme für einen Tag ohne verwertbare Zeiten: ein ganzer Tag.
DEFAULT_HOURS = Decimal('8')


def event_days(event):
    """Ein Eintrag je Tag eines Termins; Stunden aus Start- und Endzeit, sonst 8."""
    end_date = event.end_date or event.start_date
    days = []
    count = (end_date - event.start_date).days + 1
    for offset in range(count):
        day = event.start_date + datetime.timedelta(days=offset)
        hours, estimated = DEFAULT_HOURS, True
        if count == 1 and event.start_time and event.end_time:
            start = datetime.datetime.combine(day, event.start_time)
            end = datetime.datetime.combine(day, event.end_time)
            if end > start:
                minutes = (end - start).seconds // 60
                hours = (Decimal(minutes) / 60).quantize(Decimal('0.25'), rounding=ROUND_HALF_UP)
                estimated = False
        days.append(dict(date=day, hours=hours, kind='day', estimated=estimated))
    return days


def nights_of(events):
    nights = []
    for event in events:
        if event.end_date and event.end_date > event.start_date:
            nights.extend(dict(receipt=None) for _ in range((event.end_date - event.start_date).days))
    return nights


def trainers_of(activity):
    guides = []
    if activity.guide:
        guides.append(activity.guide)
    guides.extend(g for g in activity.team.all() if g not in guides)
    return guides


def claim_events(activity, kind):
    """Die Termine, deren Tage abgerechnet werden."""
    if kind == 'tour':
        return [activity.tour]
    event = activity.instruction
    meetings = list(activity.meeting_list.filter(deprecated=False).order_by('start_date'))
    # Oft umspannt der Haupttermin nur den ganzen Kurs (18.1. bis 15.2.), und
    # die Kurstermine sind die eigentlichen Tage. Liegt ein Kurstermin in
    # seinem Zeitraum, zählt der Haupttermin daher nicht als eigene Tage.
    end = event.end_date or event.start_date
    umbrella = any(event.start_date <= m.start_date <= end for m in meetings)
    return meetings if umbrella else [event] + meetings


def member_id(guide):
    profile = getattr(guide.user, 'profile', None) if guide else None
    return getattr(profile, 'member_id', '') or ''


def trainer_data(guide):
    return dict(
        id=guide.pk,
        name=guide.name,
        level=guide_level(guide),
        phone=guide.mobile or guide.phone or '',
        memberId=member_id(guide),
        qualification=guide.qualification_list() or '',
    )


def moment(day, clock):
    text = date_format(day, 'j.n.Y')
    if clock:
        text += ', ' + date_format(datetime.datetime.combine(day, clock), 'G.i') + ' Uhr'
    return text


def defaults(activity, kind, user):
    """
    Die Vorbelegung des Dialogs. ``activity`` ist eine Tour oder ein Kurs,
    ``user`` der angemeldete Benutzer: Ist er Leiter oder im Team, ist er als
    abrechnender Trainer vorgewählt.
    """
    event = activity.tour if kind == 'tour' else activity.instruction
    events = claim_events(activity, kind)
    days = sorted((d for item in events for d in event_days(item)), key=lambda d: d['date'])

    trainers = [trainer_data(g) for g in trainers_of(activity)]
    own = next((t for t in trainers if t['id'] == user.pk), None)
    chosen = own or (trainers[0] if trainers else None)

    first, last = events[0], events[-1]
    shuttle = bool(event.shuttle_service)
    return dict(
        kind=kind,
        reference=str(event.reference),
        title=event.title,
        date=event.long_date(with_year=True),
        place=event.source or event.location or '',
        begin=moment(first.start_date, first.start_time),
        end=moment(last.end_date or last.start_date, last.end_time),
        leaders=len(trainers),
        trainers=trainers,
        trainerId=chosen['id'] if chosen else None,
        name=chosen['name'] if chosen else '',
        phone=chosen['phone'] if chosen else '',
        memberId=chosen['memberId'] if chosen else '',
        qualification=chosen['qualification'] if chosen else '',
        level=chosen['level'] if chosen else 1,
        days=[dict(date=d['date'].isoformat(), hours=str(d['hours']), kind=d['kind'], estimated=d['estimated'])
              for d in days],
        nights=nights_of(events),
        # Mit Sektionsbus/Alpin-Shuttle gibt es kein km-Geld für den Leiter.
        carKm=0 if shuttle else (event.distance or 0),
        shuttle=shuttle,
        participants=getattr(activity, 'cur_quantity', None) or None,
        invoiceDate=datetime.date.today().isoformat(),
        rates=dict(
            tour=dict(short=str(TOUR_SHORT), long=str(TOUR_LONG)),
            course={str(level): [str(r) for r in rates] for level, rates in COURSE_RATES.items()},
            levels={str(level): name for level, name in LEVEL_NAMES.items()},
            preliminary=str(PRELIMINARY),
            nightFlat=str(NIGHT_FLAT),
            nightMax=str(NIGHT_MAX),
            kmCar=str(KM_CAR),
            kmBike=str(KM_BIKE),
            kmPassenger=str(KM_PASSENGER),
            leitfaden=LEITFADEN,
        ),
    )


def may_claim(user, activity):
    """Abrechnen dürfen Leitung und Team der Veranstaltung sowie die Geschäftsstelle."""
    if not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    return any(g.user_id == user.pk for g in trainers_of(activity))


# --- Eingaben aus dem Dialog --------------------------------------------------

def decimal(**kwargs):
    return serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0'), **kwargs)


class ClaimDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    hours = serializers.DecimalField(max_digits=4, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('24'))
    kind = serializers.ChoiceField(choices=['day', 'preliminary'], default='day')


class ClaimNightSerializer(serializers.Serializer):
    receipt = decimal(allow_null=True, default=None)


class ClaimExpenseSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=80, allow_blank=True, default='')
    amount = decimal(default=Decimal('0'))


class ClaimInputSerializer(serializers.Serializer):
    trainerId = serializers.IntegerField(allow_null=True, required=False, default=None)
    name = serializers.CharField(max_length=100, allow_blank=True, default='')
    address = serializers.CharField(max_length=300, allow_blank=True, default='')
    phone = serializers.CharField(max_length=75, allow_blank=True, default='')
    memberId = serializers.CharField(max_length=20, allow_blank=True, default='')
    qualification = serializers.CharField(max_length=200, allow_blank=True, default='')
    country = serializers.CharField(max_length=60, allow_blank=True, default='')
    iban = serializers.CharField(max_length=42, allow_blank=True, default='')
    bank = serializers.CharField(max_length=80, allow_blank=True, default='')
    level = serializers.IntegerField(min_value=1, max_value=4, default=1)
    days = ClaimDaySerializer(many=True, default=list)
    nights = ClaimNightSerializer(many=True, default=list)
    carKm = serializers.IntegerField(min_value=0, max_value=20000, default=0)
    bikeKm = serializers.IntegerField(min_value=0, max_value=20000, default=0)
    passengerKm = serializers.IntegerField(min_value=0, max_value=20000, default=0)
    publicTransport = decimal(allow_null=True, default=None)
    bahncard = serializers.ChoiceField(choices=list(BAHNCARD), default='none')
    travelFrom = serializers.CharField(max_length=80, allow_blank=True, default='')
    travelTo = serializers.CharField(max_length=80, allow_blank=True, default='')
    expenses = ClaimExpenseSerializer(many=True, default=list)
    participants = serializers.IntegerField(min_value=0, max_value=999, allow_null=True, required=False, default=None)
    invoiceDate = serializers.DateField(allow_null=True, required=False, default=None)
    note = serializers.CharField(max_length=1000, allow_blank=True, default='')

    def validate_iban(self, value):
        if value.strip() and not iban_valid(value):
            raise serializers.ValidationError('Die IBAN ist ungültig (Länge oder Prüfziffer).')
        return format_iban(value) if value.strip() else ''

    def validate(self, data):
        for name, limit in (('days', 60), ('nights', 60), ('expenses', 30)):
            if len(data[name]) > limit:
                raise serializers.ValidationError({name: f'Höchstens {limit} Einträge.'})
        return data


# --- PDF ----------------------------------------------------------------------

def tex(value):
    from server.printouts import tex as printout_tex
    return printout_tex(value)


def amount_tex(value):
    return tex(f'{money(value):.2f}'.replace('.', ',') + ' €')


def rows_tex(rows):
    return '\n'.join(
        f'{tex(r.label)} & {tex(r.rate)} & {tex(r.quantity)} & {amount_tex(r.amount)}\\\\' for r in rows
    )


def block(title, rows, sum_label, extra=''):
    """Ein Abschnitt wie im Formular: grüner Balken, Positionen, Summe."""
    body = rows_tex(rows) if rows else '\\multicolumn{4}{@{}l}{\\textit{keine}}\\\\'
    return (
        f'\\claimBar{{{tex(title)}}}{{{extra}}}\n'
        '\\begin{claimRows}\n'
        f'{body}\n'
        '\\hline\n'
        f'\\multicolumn{{3}}{{@{{}}r}}{{\\textbf{{{tex(sum_label)}}}}} & \\textbf{{{amount_tex(Claim.sum(rows))}}}\\\\\n'
        '\\end{claimRows}'
    )


def value_or_blank(value):
    return tex(value) if value not in (None, '') else '\\claimBlank'


DECLARATION = (
    'Hiermit erkläre ich, dass meine jährlichen Einkünfte aus einer oder mehreren Nebentätigkeiten für '
    'gemeinnützige Organisationen 3.300 € nicht überschreiten und die bis zu diesem Betrag gehende '
    'Steuerbefreiung nicht bereits in einem anderen Dienst- oder Auftragsverhältnis berücksichtigt worden ist '
    'oder noch berücksichtigt wird. Einkünfte, die den Steuerfreibetrag von 3.300 € überschreiten, müssen vom '
    'Übungsleiter selbst versteuert werden. Ich versichere, dass die Angaben korrekt sind und bitte um '
    'Überweisung auf oben genanntes Konto.'
)


def claim_source(activity, kind, data, claim, info):
    """
    Der Inhalt des PDFs in TeX, im Aufbau des Formulars "Abrechnung". ``info``
    sind die Angaben zur Veranstaltung aus ``defaults()`` (Ort, Beginn, Ende, Leiter).
    """
    event = activity.tour if kind == 'tour' else activity.instruction
    art = 'Tourenbetrieb' if kind == 'tour' else f'Kurs, Kategorie {LEVEL_NAMES[claim.level]}'
    days = data.get('days', [])

    head = '\n'.join([
        f'\\claimPair{{Name}}{{{value_or_blank(data.get("name"))}}}{{Veranstaltung}}{{{tex(event.title)}}}',
        f'\\claimPair{{Anschrift}}{{{value_or_blank(", ".join(l.strip() for l in (data.get("address") or "").splitlines() if l.strip()))}}}'
        f'{{Buchungscode}}{{{tex(event.reference)}}}',
        f'\\claimPair{{Telefon}}{{{value_or_blank(data.get("phone"))}}}{{Ort}}{{{value_or_blank(info.get("place"))}}}',
        f'\\claimPair{{Mitgliedsnummer}}{{{value_or_blank(data.get("memberId"))}}}{{Land}}{{{value_or_blank(data.get("country"))}}}',
        f'\\claimPair{{Qualifikation}}{{{value_or_blank(data.get("qualification"))}}}{{Beginn}}{{{tex(info.get("begin"))}}}',
        f'\\claimPair{{Art}}{{{tex(art)}}}{{Ende}}{{{tex(info.get("end"))}}}',
        f'\\claimPair{{Teilnehmer}}{{{value_or_blank(data.get("participants"))}}}'
        f'{{Tage / Leiter}}{{{tex(len(days))} / {tex(info.get("leaders"))}}}',
    ])

    dates = ', '.join(
        f'{date_format(d["date"], "j.n.")} {number_text(d["hours"])} Std.'
        + (' (Vorbespr.)' if d.get('kind') == 'preliminary' else '')
        for d in days
    )
    route = ' – '.join(x for x in (data.get('travelFrom'), data.get('travelTo')) if x)

    parts = [
        '\\claimHeader',
        '\\begin{claimHead}\n' + head + '\n\\end{claimHead}',
        block('Aufwandsentschädigung', claim.compensation, 'Summe Aufwandsentschädigung'),
    ]
    if dates:
        parts.append(f'\\claimSmall{{Termine: {tex(dates)}}}')
    parts.append(block('Fahrtkosten', claim.travel, 'Summe Fahrtkosten', tex(route)))
    parts.append(block('Sonstiges (nur mit vorliegenden Originalbelegen)', claim.expenses, 'Summe Sonstiges'))
    if (data.get('note') or '').strip():
        parts.append(f'\\claimSmall{{Bemerkung: {tex(data["note"].strip())}}}')
    parts.append('\\claimMobility')

    if data.get('iban'):
        account = f'IBAN: {tex(data["iban"])}\\\\ Bank: {value_or_blank(data.get("bank"))}'
    else:
        account = (
            '\\claimBox{} lt. Mitgliederverwaltung\\\\[0.6ex]'
            'oder IBAN: \\claimBlank\\\\[0.6ex] Bank: \\claimBlank'
        )
    totals = (
        f'Summe Aufwandsentschädigung & {amount_tex(Claim.sum(claim.compensation))}\\\\'
        f'Summe Fahrtkosten & {amount_tex(Claim.sum(claim.travel))}\\\\'
        f'Summe Sonstiges & {amount_tex(Claim.sum(claim.expenses))}\\\\'
        f'\\hline\\textbf{{Ergebnis}} & \\textbf{{{amount_tex(claim.total)}}}\\\\'
    )
    parts.append(f'\\claimAccount{{{account}}}{{{totals}}}')
    parts.append(f'\\claimDeclaration{{{tex(DECLARATION)}}}')
    invoice = data.get('invoiceDate') or datetime.date.today()
    parts.append(f'\\claimSignature{{{tex(date_format(invoice, "j.n.Y"))}}}')
    return '\n\n'.join(parts)


def claim_document(content, reference):
    from server.latex import template

    footer = (
        f'Abrechnung {reference} · erstellt am {date_format(datetime.date.today(), "j. F Y")} '
        f'aus dem WebTool · {LEITFADEN}'
    )
    return template('claim.tex').replace('%%Footer%%', tex(footer)).replace('%%Content%%', content)


def claim_pdf(activity, kind, data, info):
    from server.printouts import render_pdf

    claim = compute(dict(data, kind=kind))
    event = activity.tour if kind == 'tour' else activity.instruction
    return render_pdf(claim_document(claim_source(activity, kind, data, claim, info), event.reference))


# --- Schnittstelle --------------------------------------------------------------

def respond(request, activity, kind):
    """
    GET liefert die Vorbelegung, POST mit den Angaben des Dialogs die Rechnung:
    als JSON für die Vorschau im Dialog, mit "Accept: application/pdf" als PDF.
    """
    from django.http import HttpResponse, JsonResponse
    from rest_framework.exceptions import PermissionDenied
    from rest_framework.response import Response

    if not may_claim(request.user, activity):
        raise PermissionDenied('Abrechnen können nur Leitung und Team der Veranstaltung sowie die Geschäftsstelle.')

    if request.method == 'GET':
        response = Response(defaults(activity, kind, request.user))
        response['Cache-Control'] = 'no-store'
        return response

    serializer = ClaimInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = dict(serializer.validated_data)

    # Trainer rechnen nur für sich selbst ab; die Geschäftsstelle für alle.
    trainer_id = data.get('trainerId')
    trainers = trainers_of(activity)
    if trainer_id is not None and trainer_id not in {g.pk for g in trainers}:
        raise serializers.ValidationError({'trainerId': 'Diese Person leitet die Veranstaltung nicht.'})
    if not request.user.is_staff:
        own = {g.pk for g in trainers if g.user_id == request.user.pk}
        if trainer_id not in own:
            raise PermissionDenied('Du kannst nur deine eigene Abrechnung erstellen.')

    if getattr(request.accepted_renderer, 'format', None) != 'pdf':
        return Response(claim_json(compute(dict(data, kind=kind))))

    pdf = claim_pdf(activity, kind, data, defaults(activity, kind, request.user))
    if pdf is None:
        return JsonResponse(
            {'detail': 'Die Abrechnung konnte nicht erzeugt werden (LaTeX fehlt oder ist fehlgeschlagen).'},
            status=503,
        )
    event = activity.tour if kind == 'tour' else activity.instruction
    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = (
        f'attachment; filename="Abrechnung_{event.reference}_{event.start_date:%Y-%m-%d}.pdf"'
    )
    response['Cache-Control'] = 'no-store'
    return response
