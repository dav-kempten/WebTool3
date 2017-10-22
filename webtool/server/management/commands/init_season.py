# -*- coding: utf-8 -*-
import datetime

from django.core.management import BaseCommand

from server.models import Season, Part, Section, Chapter
from server.models import Calendar, Anniversary, Vacation
from server.models import Category, Approximate
from server.models import Skill, SkillDescription
from server.models import Fitness, FitnessDescription
from server.models import Equipment
from server.models import State
from server.models import QualificationGroup, Qualification
from server.models import get_default_season


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
        anniversary.calendars.add(calendar)

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
        {'name': 'Vorschläge', 'description': 'Vorschläge für Veranstaltungen', 'order': 80},
    ]

    season = get_default_season()
    for data in values:
        part = Part(**data)
        part.save()
        part.seasons.add(season)


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
        part = Part.objects.get(seasons=season, name=part_name)
        section = Section(part=part, **data)
        section.save()


def init_category():

    values = [
        {'tour': True, 'order': 10,  'code': 'SST', 'name': 'Schneeschuhtour', 'winter': True},
        {'tour': True, 'order': 20,  'code': 'SGH', 'name': 'Schneeschuh- Gletscher/Hochtour', 'winter': True},
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
        {'deadline': True, 'order': 150, 'code': 'AS0', 'name': 'Anmeldeschluss'},
        {'preliminary': True, 'order': 160, 'code': 'VB0', 'name': 'Vorbesprechung'},
    ]

    season = get_default_season()
    for data in values:
        category = Category(**data)
        category.save()
        category.seasons.add(season)


def init_chapter():

    season = get_default_season()
    categories = Category.objects.filter(seasons=season, tour=True, deprecated=False)
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
            p = Part.objects.get(seasons=season, name=part)
            s = Section.objects.get(part=p, name=section)
            chapter = Chapter(name=name, order=order, section=s)
            chapter.save()


def init_approximate():


    # approximate = 1 => Genau
    # approximate = 2 => Morgens
    # approximate = 3 => Vormittags
    # approximate = 4 => Mittags
    # approximate = 5 => Nachmittags
    # approximate = 6 => Abends

    values = [
        {'name': 'morgens', 'description': 'bis 9:00', 'start_time': datetime.time(7, 0), 'default': True},
        {'name': 'vormittags', 'description': 'ab 9:00 bis 12:00', 'start_time': datetime.time(9, 0)},
        {'name': 'mittags', 'description': 'ab 12:00 bis 14:00', 'start_time': datetime.time(12, 00)},
        {'name': 'nachmittags', 'description': 'ab 14:00 bis 17:00', 'start_time': datetime.time(14, 00)},
        {'name': 'abends', 'description': 'ab 17:00', 'start_time': datetime.time(17, 00)},
    ]

    season = get_default_season()
    for data in values:
        approximate = Approximate(**data)
        approximate.save()
        approximate.seasons.add(season)


def init_skill():

    values = [
        {
            "description": {
                "RDT": "",
                "KSG": "Wenig bis mäßig schwierig, K1-K2, Trittsicherheit und Schwindelfreiheit nötig",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Für Anfänger geeignet",
                "GHT": "Gletscher bis 35 Grad, Umgang mit Pickel und Steigeisen, Anseilen am Gletscher",
                "SKT": "Steilpassagen bis ca. 30 Grad, sicheres Aufsteigen mit Fellen, sicheres Abfahren in allen Schneearten",
                "BGT": "Für Anfänger geeignet",
                "SGH": "",
                "KLT": "",
                "MTB": "Überwiegend breite und befestigte Wege",
            },
            "code": "△",
            "order": 1
        },
        {
            "description": {
                "RDT": "",
                "KSG": "Steile und ausgesetzte Passagen, Armkraft und körperliche Gewandtheit nötig, K3-K4",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Steilpassagen bis 30 Grad, Trittsicherheit und Schwindelfreiheit nötig",
                "GHT": "Gletscher bis 40 Grad, sicherer Umgang mit Seil, Pickel und Steigeisen, Kenntnisse Spaltenbergung, etwas Kletterkönnen in Eis und Fels",
                "SKT": "Sichere Skitechnik in Aufstieg und Abfahrt, auch bei widrigen Schneeverhältnissen, gute Spitzkehrentechnik, Trittsicherheit und Schwindelfreiheit",
                "BGT": "Trittsicherheit und Schwindelfreiheit nötig",
                "SGH": "",
                "KLT": "",
                "MTB": "Zusätzlich leichte Singletrails",
            },
            "code": "△△",
            "order": 2
        },
        {
            "description": {
                "RDT": "",
                "KSG": "Senkrecht, oft überhängend, gute Armkraft, Ausdauer und Kletterkönnen nötig, wenig künstl. Haltepunkte, K5-K6",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Steilpassagen über 30 Grad, Steigeisenkenntnisse",
                "GHT": "Gletscher über 45 Grad, gutes Kletterkönnen in Eis und Fels, sehr sicheres Beherrschen der Ausrüstung und der Sicherungstechnik im Eis",
                "SKT": "Steilpassagen bis ca. 40 Grad, sehr gute Skitechnik, ggf. sicherer Umgang mit Pickel und Steigeisen",
                "BGT": "Zusätzlich Bergerfahrung, sicheres Steigen und Klettern in kurzen Felspassagen",
                "SGH": "",
                "KLT": "",
                "MTB": "Zusätzlich schwere Singletrails, die eine gute Bike- Beherrschung erfordern",
            },
            "code": "△△△",
            "order": 3
        }
    ]

    season = get_default_season()
    for data in values:
        description = data.pop('description')
        skill = Skill(**data)
        skill.default = (data['order'] == 1)
        skill.save()
        skill.seasons.add(season)
        for code, description in description.items():
            category = Category.objects.get(seasons=season, code=code)
            skill_description = SkillDescription(skill=skill, category=category, description=description)
            skill_description.save()


def init_fitness():

    values = [
        {
            "description": {
                "RDT": "",
                "KSG": "Aufstiege bis ca. 800 Hm, bis ca. 5 Std. Gesamtgehzeit",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Aufstiege bis ca. 800 Hm, bis ca. 5 Std. Gesamtgehzeit",
                "GHT": "Aufstiege bis ca. 800 Hm, bis ca. 5 Std. Gesamtgehzeit",
                "SKT": "Aufstiege bis ca. 800 Hm, bis ca. 5 Std. Gesamtzeit",
                "BGT": "Aufstiege bis ca. 800 Hm, bis ca. 5 Std. Gesamtgehzeit",
                "SGH": "",
                "KLT": "",
                "MTB": "Bis 1000 Hm, bis ca. 30 km und ca. 4 Std. Fahrzeit",
            },
            "code": "△",
            "order": 1,
        },
        {
            "description": {
                "RDT": "",
                "KSG": "Aufstiege bis ca. 1200 Hm, bis ca. 8 Std. Gesamtgehzeit",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Aufstiege bis ca. 1200 Hm, bis ca. 8 Std. Gesamtgehzeit",
                "GHT": "Aufstiege bis ca. 1200 Hm, bis ca. 8 Std. Gesamtgehzeit",
                "SKT": "Aufstiege bis ca. 1200 Hm, bis ca. 8 Std. Gesamtzeit",
                "BGT": "Aufstiege bis ca. 1200 Hm, bis ca. 8 Std. Gesamtgehzeit",
                "SGH": "",
                "KLT": "",
                "MTB": "Bis 1500 Hm, bis ca. 50 km und ca. 6 Std. Fahrzeit",
            },
            "code": "△△",
            "order": 2,
        },
        {
            "description": {
                "RDT": "",
                "KSG": "Aufstiege über 1200 Hm, über 8 Std. Gesamtgehzeit",
                "FRD": "",
                "SHT": "",
                "SBD": "",
                "SST": "Aufstiege über 1200 Hm, über 8 Std. Gesamtgehzeit",
                "GHT": "Aufstiege über 1200 Hm, über 8 Std. Gesamtgehzeit",
                "SKT": "Aufstiege über 1200 Hm, über 8 Std. Gesamtzeit",
                "BGT": "Aufstiege über 1200 Hm, über 8 Std. Gesamtgehzeit",
                "SGH": "",
                "KLT": "",
                "MTB": "Über 1500 Hm, über 50 km und über 6 Std. Fahrzeit, plus Schiebe- und Tragepassagen",
            },
            "code": "△△△",
            "order": 3,
        },
    ]

    season = get_default_season()
    for data in values:
        description = data.pop('description')
        fitness = Fitness(**data)
        fitness.default = (data['order'] == 1)
        fitness.save()
        fitness.seasons.add(season)
        for code, description in description.items():
            category = Category.objects.get(seasons=season, code=code)
            fitness_description = FitnessDescription(fitness=fitness, category=category, description=description)
            fitness_description.save()


def init_equipment():

    values = [
        {
            "code": "A",
            "name": "Wandern und Bergsteigen",
            "description": "Wander-/Trekkingschuhe bzw. Bergstiefel, Rucksack, Wetterschutz (Jacke, ggf. Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*",
            "default": True
        },
        {
            "code": "B",
            "name": "Klettersteigausrüstung",
            "description": "Ausrüstung A + Hüftgurt, ggf. Brustgurt, Steinschlaghelm, Klettersteigset, HMS-Karabiner, Bandschlinge (60 oder 120 cm)",
        },
        {
            "code": "C1",
            "name": "Sportklettern Indoor",
            "description": "Kletterschuhe, Hüftgurt, HMS-Karabiner, Halbautomat (z. B. Edelrid Jul²), Chalkbag",
        },
        {
            "code": "C2",
            "name": "Bouldern Indoor",
            "description": "Kletterschuhe, Chalkbag",
        },
        {
            "code": "C3",
            "name": "Sportklettern Outdoor",
            "description": "Feste Zustiegsschuhe, Kletterschuhe, Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze (fakultativ), Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Hüftgurt, ggf. Brustgurt, Steinschlaghelm, Halbautomat (z. B. Edelrid Jul²), HMS-Karabiner, Safelockkarabiner, Expressschlingen (5 Stück), Bandschlinge (120 cm), Abseilgerät, Chalkbag",
        },
        {
            "code": "C4",
            "name": "Alpinklettern",
            "description": "Feste Zustiegsschuhe oder Wander-/Trekkingschuhe bzw. Bergstiefel, Kletterschuhe, Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Hüftgurt, ggf. Brustgurt, Steinschlaghelm, Klemmkeil-Set, 1 Abseilgerät, 2 HMS-Karabiner, 1 Safelockkarabiner, 5 Expressschlingen, 3 Normalkarabiner, 2 Bandschlingen (120 cm), 3 Prusikschlingen (4, 2, 1m Länge u. 6 mm Durchmesser)",
        },
        {
            "code": "D",
            "name": "Hochtourenausrüstung",
            "description": "Steigeisenfeste Bergstiefel, Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze,\nSonnenschutz (Kopfbedeckung, Gletscherbrille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Hüftgurt, ggf. Brustgurt, Steinschlaghelm, Steigeisen, Eispickel, Eisschraube, Gletscherset (1 HMS-Karabiner, 1 Safelockkarabiner, 3 Normalkarabiner, 1 Bandschlinge 120 cm, 3 Prusikschlingen mit 4, 2, 1 m Länge u. 6 mm Durchmesser)",
        },
        {
            "code": "E1",
            "name": "Skitouren",
            "description": "Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Tourenski mit Aufstiegsbindung, Felle und Harscheisen, Stöcke, Mehrantennen-LVS-Gerät, Lawinensonde, Lawinenschaufel",
        },
        {
            "code": "E2",
            "name": "Skihochtouren",
            "description": "Ausrüstung E1 + Hüftgurt, ggf. Brustgurt, Steigeisen, Eispickel, Eisschraube, Gletscherset (1 HMS-Karabiner, 1 Safelockkarabiner, 3 Normalkarabiner, 1 Bandschlinge 120 cm, 3 Prusikschlingen mit 4, 2, 1 m Länge u. 6 mm Durchmesser)",
        },
        {
            "code": "F1",
            "name": "Schneeschuhtouren",
            "description": "Bergschuhe, Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Gebirgstaugliche Schneeschuhe, Stöcke, Mehrantennen-LVS-Gerät, Lawinensonde, Lawinenschaufel",
        },
        {
            "code": "F2",
            "name": "Schneeschuhhochtouren",
            "description": "Ausrüstung F1 + Hüftgurt, ggf. Brustgurt, Steigeisen, Eispickel, Eisschraube, Gletscherset (1 HMS-Karabiner, 1 Safelockkarabiner, 3 Normalkarabiner, 1 Bandschlinge 120 cm, 3 Prusikschlingen mit 4, 2, 1 m Länge u. 6 mm Durchmesser)",
        },
        {
            "code": "G",
            "name": "Freeride",
            "description": "Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Freerideski/Allmountain oder Tourenski mit Aufstiegsbindung und Felle, ggf. Harscheisen, Stöcke, Mehrantennen-LVS-Gerät, Lawinensonde, LawinenschaufelIm Grundkurs Freeride sind keine Aufstiegsbindungen und Felle erforderlich!",
        },
        {
            "code": "H",
            "name": "Steileisklettern",
            "description": "Bergschuhe, Rucksack, Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Hüftgurt, ggf. Brustgurt, Steinschlaghelm, Steigeisen, Steileisgerät, 2 Eisschrauben, Mehrantennen-LVS-Gerät, Lawinensonde, Lawinenschaufel, 1 Abseilgerät, 2 HMS-Karabiner, 1 Safelockkarabiner, 5 Expressschlingen, 3 Normalkarabiner, 2 Bandschlingen (120 cm), 3 Prusikschlingen (4, 2, 1 m Länge u. 6 mm Durchmesser)",
        },
        {
            "code": "I",
            "name": "Nordic/Skating",
            "description": "Wetterschutz (Jacke, Überhose), Handschuhe & Mütze, Sonnenschutz (Kopfbedeckung, Brille, Sonnencreme), Trinkflasche, Erste-Hilfe-Set*, Skatingski, Skatingschuhe, Skatingstöcke",
        },
        {
            "code": "J",
            "name": "Mountainbike",
            "description": "Rucksack, Wetterschutz (Jacke, Überhose), Sonnenschutz (Kopfbedeckung, Sonnencreme), Trinkflasche, Stirnlampe/Taschenlampe, Erste-Hilfe-Set*, Biwaksack*, Mountainbike, Fahrradhelm, Fahrradbrille, Fahrradhandschuhe, Fahrradhose, Luftpumpe*, Ersatzschlauch, Reparaturset (Flicken) ggf. Protektoren",
        },
        {
            "code": "K",
            "name": "Hüttenübernachtung",
            "description": "Hüttenschlafsack, Hüttenschuhe, Freizeitkleidung, Waschzeug, DAV-Ausweis",
        },
    ]

    season = get_default_season()
    for data in values:
        equipment = Equipment(**data)
        equipment.save()
        equipment.seasons.add(season)


def init_state():

    values = [
        {
            "name": "In Arbeit",
            "description": "Der Termin wird gerade bearbeitet",
            "order": 1,
            "public": False,
            "default": True,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Fertig",
            "description": "Die Bearbeitung des Termins ist abeschlossen",
            "order": 2,
            "public": False,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Abgelehnt",
            "description": "Die Inhalte wurden geprüft, konnten so aber nicht freigegeben werden",
            "order": 3,
            "public": False,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Freigegeben",
            "description": "Die Inhalte wurden geprüft und freigegeben",
            "order": 4,
            "public": False,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Veröffentlicht",
            "description": "Der Termin ist bereits der Öffentlichkeit zugänglich",
            "order": 5,
            "public": True,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Durchgeführt",
            "description": "Die Veranstaltung wurde durchgeführt",
            "order": 6,
            "public": True,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": False,
            "done": True,
        },
        {
            "name": "Ausgefallen",
            "description": "Die Veranstaltung wurde abgesagt",
            "order": 7,
            "public": True,
            "default": False,
            "canceled": True,
            "moved": False,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Verschoben",
            "description": "Die Veranstaltung wurde verschoben",
            "order": 8,
            "public": True,
            "default": False,
            "canceled": False,
            "moved": True,
            "unfeasible": False,
            "done": False,
        },
        {
            "name": "Noch nicht buchbar",
            "description": "Die Veranstaltung ist noch nicht buchbar wird aber bald freigeschaltet",
            "order": 9,
            "public": True,
            "default": False,
            "canceled": False,
            "moved": False,
            "unfeasible": True,
            "done": False,
        }
    ]

    season = get_default_season()
    for data in values:
        state = State(**data)
        state.save()
        state.seasons.add(season)


def init_qualification():

    values = {
        'Trainer': [
            ['TBH', 'Trainer B Hochtouren'],
            ['TBSHT', 'Trainer B Skihochtour'],
            ['TBA', 'Trainer B Alpinklettern'],
            ['TBE', 'Trainer B Eisfallklettern'],
            ['TBP', 'Trainer B Plaisirklettern'],
            ['TBK', 'Trainer B Klettersteig'],
            ['TBLS', 'Trainer B Sportklettern Leistungssport'],
            ['TBSP', 'Trainer B Sportklettern Breitensport'],
            ['TCB', 'Trainer C Bergsteigen'],
            ['TCLS', 'Trainer C Sportklettern Leistungssport'],
            ['TCSP', 'Trainer C Sportklettern Breitensport'],
            ['TCK', 'Trainer C Kajak'],
            ['TCBW', 'Trainer C Bergwandern'],
            ['TCBM', 'Trainer C Klettern für Menschen mit Behinderung'],
            ['TCBO', 'Trainer C Bouldern Breitensport'],
        ],
        'Fachübungsleiter': [
            ['HT', 'Fachübungsleiter Hochtouren'],
            ['SB', 'Fachübungsleiter Skibergsteigen'],
            ['AK', 'Fachübungsleiter Alpinklettern'],
            ['BS', 'Fachübungsleiter Bergsteigen'],
            ['MTB', 'Fachübungsleiter Mountainbike'],
            ['SK', 'Fachübungsleiter Skilauf'],
            ['SLL', 'Fachübungsleiter Skilanglauf'],
        ],
        'Leiter + Zusatzqualifikation': [
            ['JL', 'JDAV-Jugendleiter'],
            ['KB', 'Kletterbetreuer'],
            ['WL', 'Wanderleiter'],
            ['FGL', 'Familiengruppenleiter'],
            ['LBS', 'Zusatzqualifikation Leistungsbergsteigen'],
            ['SSB', 'Zusatzqualifikation Schneeschuhbergsteigen'],
            ['EK', 'Zusatzqualifikation Eisfallklettern'],
            ['FR', 'Zusatzqualifikation Freeride'],
            ['RB', 'Zusatzqualifikation Routenbau Breitensport'],
            ['FRG', 'Freeride Guide'],
        ],
        'Berufsausbildungen': [
            ['BSF', 'staatl. gepr. Berg- und Skiführer (UIAGM)'],
            ['SL', 'staatl. gepr. Skilehrer'],
        ],
        'Weitere': [
            ['BR', 'Bergrettung'],
            ['AW', 'Anwärter'],
            ['KLA', 'Kletterassistent (Kempten)'],
        ]
    }

    for group_order, data in enumerate(values.items(), 1):
        group_name, member = data
        group = QualificationGroup(order=group_order, name=group_name)
        group.save()
        for order, q_data in enumerate(member, 1 + (group_order - 1) * 20):
            code, name = q_data
            qualification = Qualification(order=order, code=code, name=name, group=group)
            qualification.save()


class Command(BaseCommand):
    help = 'Init season data'

    def handle(self, *args, **options):
        init_season('2017')
        init_calendar()
        init_part()
        init_section()
        init_category()
        init_chapter()
        init_approximate()
        init_skill()
        init_fitness()
        init_equipment()
        init_qualification()
        init_state()
