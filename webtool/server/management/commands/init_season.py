# -*- coding: utf-8 -*-
import datetime

from django.core.management import BaseCommand

from ...models import Season, Part, Section, Chapter
from ...models import Calendar, Anniversary, Vacation
from ...models import Category, Approximate
from ...models import get_default_season


def init_season(name='2017'):

    season = Season(name=name, current=True)
    season.save()


def init_calendar():

    calendar = Calendar()
    calendar.save()

    values = [
        {'public_holiday': True, 'fixed_date': u'01.01.', 'name': u'Neujahr', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'06.01.', 'name': u'Heilige drei Köige', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'01.05.', 'name': u'Tag der Arbeit', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'03.10.', 'name': u'Tag d. dt. Einheit', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'14.02.', 'name': u'Valentinstag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Muttertag', 'weekday': 6, 'month': 5, 'day_occurrence': 2, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'15.08.', 'name': u'Mariä Himmelfahrt', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'01.11.', 'name': u'Allerheiligen', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Karfreitag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': -2, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Ostermontag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 1, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Christi Himmelfahrt', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 39, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Pfingstmontag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 50, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Herz-Jesu-Sonntag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 70, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Fronleichnam', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 60, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'27.06.', 'name': u'Siebenschläfer', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'31.10.', 'name': u'Reformationstag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'20.03.', 'name': u'Frühlingsanfang', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'21.06.', 'name': u'Sommeranfang', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'23.09.', 'name': u'Herbstanfang', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'21.12.', 'name': u'Winteranfang', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Beginn Sommerzeit', 'weekday': 6, 'month': 3, 'day_occurrence': -1, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Erntedank', 'weekday': 6, 'month': 10, 'day_occurrence': 1, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Beginn Winterzeit', 'weekday': 6, 'month': 10, 'day_occurrence': -1, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Rosenmontag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': -48, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Aschermittwoch', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': -46, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'1. Advent', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': 0},
        {'public_holiday': True, 'fixed_date': None, 'name': u'2. Advent', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': 7},
        {'public_holiday': True, 'fixed_date': None, 'name': u'3. Advent', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': 14},
        {'public_holiday': True, 'fixed_date': None, 'name': u'4. Advent', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': 21},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Buß und Bettag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': -11},
        {'public_holiday': False, 'fixed_date': u'06.12.', 'name': u'Nikolaus', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Gründonnerstag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': -3, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'23.04.', 'name': u'Georgitag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Totensonntag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': -7},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Funkensonntag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': -42, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Ostern', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 0, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Volkstrauertag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': -14},
        {'public_holiday': True, 'fixed_date': None, 'name': u'Pfingsten', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': 49, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': None, 'name': u'Kirchweih', 'weekday': 6, 'month': 10, 'day_occurrence': 3, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'24.12.', 'name': u'Heiligabend', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'25.12.', 'name': u'1. Weihnachtsfeiertag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': True, 'fixed_date': u'26.12.', 'name': u'2. Weihnachtsfeiertag', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
        {'public_holiday': False, 'fixed_date': u'31.12.', 'name': u'Sylvester', 'weekday': None, 'month': None, 'day_occurrence': None, 'easter_offset': None, 'advent_offset': None},
    ]

    for data in values:
        anniversary = Anniversary(**data)
        anniversary.save()

    calendar.calc_anniversary_order()

    values = [
        {'start_date': datetime.date(2016, 12, 24), 'end_date': datetime.date(2017, 1, 5), 'name': u'Weihnachtsferien 2016/2017'},
        {'start_date': datetime.date(2017, 2, 27), 'end_date': datetime.date(2017, 3, 3), 'name': u'Frühjahrsferien'},
        {'start_date': datetime.date(2017, 4, 10), 'end_date': datetime.date(2017, 4, 22), 'name': u'Osterferien'},
        {'start_date': datetime.date(2017, 6, 6), 'end_date': datetime.date(2017, 6, 16), 'name': u'Pfingstferien'},
        {'start_date': datetime.date(2017, 7, 29), 'end_date': datetime.date(2017, 9, 11), 'name': u'Sommerferien'},
        {'start_date': datetime.date(2017, 10, 30), 'end_date': datetime.date(2017, 11, 3), 'name': u'Herbstferien'},
        {'start_date': datetime.date(2017, 12, 23), 'end_date': datetime.date(2018, 1, 5), 'name': u'Weihnachtsferien 2017/2018'},
    ]

    for data in values:
        vacation = Vacation(**data)
        vacation.save()


def init_part():

    values = [
        {'name': 'Jugend', 'description': 'Jugend on tour', 'order': 10},
        {'name': 'Winter', 'description': 'Winterprogramm', 'order': 20},
        {'name': 'Sommer', 'description': 'Sommerprogramm', 'order': 30},
        {'name': 'Kletterschule', 'description': 'DAV-Kletterschule', 'order': 40},
        {'name': 'Events', 'description': 'Vorträge & Events', 'order': 50},
        {'name': 'Gruppen', 'description': 'Gruppen', 'order': 60},
        {'name': 'Obergünzburg', 'description': 'Ortsgruppe Obergünzburg', 'order': 70},
        {'name': 'Vorschläge', 'description': 'Vorschläge für Veranstalungen', 'order': 80},
    ]

    for data in values:
        part = Part(**data)
        part.save()


def init_section():

    values = [
        {'part': 'Winter', 'name': 'Touren', 'description': 'Gemeinschaftstouren Winter', 'order': 10},
        {'part': 'Winter', 'name': 'Kurse', 'description': 'Aus- und Fortbildung Winter', 'order': 20},
        {'part': 'Sommer', 'name': 'Touren', 'description': 'Gemeinschaftstouren Sommer', 'order': 30},
        {'part': 'Sommer', 'name': 'Kurse', 'description': 'Aus- und Fortbildung Sommer', 'order': 40},
        {'part': 'Kletterschule', 'name': 'Einsteiger', 'description': 'Einsteiger', 'order': 50},
        {'part': 'Kletterschule', 'name': 'Fortgeschrittene', 'description': 'Fortgeschrittene', 'order': 60},
        {'part': 'Kletterschule', 'name': 'Kinder & Familien', 'description': 'Kinder & Familien', 'order': 70},
        {'part': 'Kletterschule', 'name': 'Gruppen', 'description': 'Gruppen, Vereine, Schulen, Firmen', 'order': 80},
        {'part': 'Kletterschule', 'name': 'Frauen', 'description': 'Frauen', 'order': 90},
        {'part': 'Obergünzburg', 'name': 'Touren', 'description': 'Gemeinschaftstouren', 'order': 100},
        {'part': 'Obergünzburg', 'name': 'Gruppen', 'description': 'Gruppen', 'order': 110},
        {'part': 'Vorschläge', 'name': 'Touren', 'description': 'Tourentermine', 'order': 120},
        {'part': 'Vorschläge', 'name': 'Kurse', 'description': 'Kurstermine', 'order': 130},
        {'part': 'Vorschläge', 'name': 'Gruppen', 'description': 'Gruppentermine', 'order': 140},
        {'part': 'Vorschläge', 'name': 'Jugend', 'description': 'Jugend on tour', 'order': 150},
        {'part': 'Events', 'name': 'Sonstiges', 'description': 'Touren', 'order': 160},
    ]

    season = get_default_season()
    for data in values:
        part_name = data.pop('part')
        part = Part.objects.get(season=season, name=part_name)
        section = Section(season=season, part=part, **data)
        section.save()


def init_category():

    values = [
        {'tour': True, 'order': 10,  'code': 'SST', 'name': 'Schneeschuhtour', 'winter': True},
        {'tour': True, 'order': 20,  'code': 'SHG', 'name': 'Schneeschuh- Gletscher/Hochtour', 'winter': True},
        {'tour': True, 'order': 30,  'code': 'SKT', 'name': 'Skitour', 'winter': True},
        {'tour': True, 'order': 40,  'code': 'SHT', 'name': 'Skihochtour', 'winter': True},
        {'tour': True, 'order': 50,  'code': 'SBD', 'name': 'Snowboardtour', 'winter': True},
        {'tour': True, 'order': 60,  'code': 'FRD', 'name': 'Freeride', 'winter': True},
        {'tour': True, 'order': 70,  'code': 'BGT', 'name': 'Bergtour', 'summer': True},
        {'tour': True, 'order': 80,  'code': 'KSG', 'name': 'Klettersteig', 'summer': True},
        {'tour': True, 'order': 90,  'code': 'KLT', 'name': 'Klettertour', 'summer': True},
        {'tour': True, 'order': 100, 'code': 'GHT', 'name': 'Gletschertour / Hochtour', 'summer': True},
        {'tour': True, 'order': 110, 'code': 'MTB', 'name': 'Mountainbike', 'summer': True},
        {'tour': True, 'order': 120, 'code': 'EBK', 'name': 'E-Bike', 'summer': True},
        {'tour': True, 'order': 130, 'code': 'RDT', 'name': 'Radtour', 'summer': True},
        {'talk': True, 'order': 140, 'code': 'TLK', 'name': 'Vortrag'},
        {'order': 140, 'code': '?', 'name': 'Sonstige'},
    ]

    for data in values:
        category = Category(**data)
        category.save()


def init_approximate():

    values = [
        {'name': 'morgens', 'description': 'bis 9:00', 'start_time': datetime.time(7, 0), 'default': True},
        {'name': 'vormittags', 'description': 'ab 9:00 bis 12:00', 'start_time': datetime.time(9, 0)},
        {'name': 'mittags', 'description': 'ab 12:00 bis 14:00', 'start_time': datetime.time(12, 00)},
        {'name': 'nachmittags', 'description': 'ab 14:00 bis 17:00', 'start_time': datetime.time(14, 00)},
        {'name': 'abends', 'description': 'ab 17:00', 'start_time': datetime.time(17, 00)},
    ]

    for data in values:
        approximate = Approximate(**data)
        approximate.save()


def init_chapter():

    season = get_default_season()
    categories = Category.objects.filter(season=season, tour=True, deprecated=False)
    for category in categories:
        name = category.name
        order = category.order
        part = 'Events'
        section = 'Sonstiges'
        if category.winter:
            part = 'Winter'
            section = 'Touren'
        if category.summer:
            part = 'Sommer'
            section = 'Touren'
        for part in (part, 'Vorschläge'):
            chapter = Chapter(
                name=name, order=order, section=Section.objects.get(season=season, part__name=part, name=section)
            )
            chapter.save()


class Command(BaseCommand):
    help = 'Init season data'

    def handle(self, *args, **options):
        init_season('2017')
        init_calendar()
        init_part()
        init_section()
        init_category()
        init_approximate()
        init_chapter()
