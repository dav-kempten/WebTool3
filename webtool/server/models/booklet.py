# -*- coding: utf-8 -*-
import re
import uuid

import io
from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField

from server.models import Reference, Event
from .time_base import TimeMixin


class Booklet(TimeMixin, models.Model):

    STATUS_PENDING = "pending"
    STATUS_FAILED = "failed"
    STATUS_DONE = "done"
    STATUSES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_FAILED, "Failed"),
        (STATUS_DONE, "Done"),
    ]

    FORMAT_DESKTOP = "desktop"
    FORMAT_PRINT = "print"
    FORMATS = [
        (FORMAT_DESKTOP, "Desktop"),
        (FORMAT_PRINT, "Print"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    references = ArrayField(
        models.CharField(max_length=7),
        size=1000,
        verbose_name = 'Inhalt',
        help_text="Welche Veranstaltungen kommen in das Booklet",
    )

    format = models.CharField(
        verbose_name='Formatvorlage',
        max_length=10,
        default=FORMAT_DESKTOP,
        choices=FORMATS,
        help_text="Formatierungsvorgaben",
    )

    header = models.CharField(
        verbose_name='Titel',
        max_length=125,
        blank=True, default='',
        help_text="Das ist der Text für das Titelblatt",
    )

    sub_header = models.CharField(
        verbose_name='Untertitel',
        max_length=125,
        blank=True, default='',
        help_text="Das ist der Untertitel für das Titelblatt",
    )

    main_header = models.CharField(
        verbose_name='Haupttitel',
        max_length=125,
        blank=True, default='',
        help_text="Das ist der Haupttitel für das Titelblatt",
    )

    status = models.CharField(
        max_length=10,
        default=STATUS_PENDING,
        choices=STATUSES,
    )

    def __str__(self):
        return str(self.id)

    class Meta:
        get_latest_by = "updated"
        verbose_name = "Programmheft"
        verbose_name_plural = "Programmhefte"
        ordering = ('updated', )

    RELAX = '\\\\\\relax'

    @classmethod
    def texify(cls, text):
        return text.replace(
            '\\', '\\textbackslash{}'
        ).replace(
            '{', '\\{'
        ).replace(
            '}', '\\}'
        ).replace(
            '&', '\\&'
        ).replace(
            '%', '\\%'
        ).replace(
            '$', '\\$'
        ).replace(
            '#', '\\#'
        ).replace(
            '_', '\\_'
        ).replace(
            '~', '\\textasciitilde{}'
        ).replace(
            '^', '\\textasciicircum{}'
        )

    @classmethod
    def render_events(cls, events):

        with io.StringIO() as s:
            last_category = None
            for event in events.order_by('reference__category__code', 'start_date'):

                category = event.reference.category
                if category != last_category:
                    last_category = category
                else:
                    category = None

                r = 'davReferenceLadiesOnly' if event.ladies_only else 'davReference'
                c = f' ({category.code})' if False else ''

                s.write(f'\\filbreak\n\\begin{{samepage}}\n')
                if category:
                    s.write(f'\\davCategory{{{cls.texify(category.name)}}}\\par')
                s.write(f'\\{r}{{{event.reference}}}\\, {event.long_date(with_year=True)}{c}{cls.RELAX}\n')

                tour = event.tour if hasattr(event, 'tour') and event.tour else None
                instruction = event.meeting if hasattr(event, 'meeting') and event.meeting else None
                session = event.session if hasattr(event, 'session') and event.session else None
                talk = event.talk if hasattr(event, 'talk') and event.talk else None

                qualifications = None

                if instruction and not instruction.is_special:
                    title = event.meeting.topic.title
                    name = event.meeting.topic.name
                    description = event.meeting.topic.description
                    if instruction.topic.qualifications.exists():
                        qualifications = instruction.topic.qualifications.values_list('name', flat=True)
                else:
                    title = event.title
                    name = event.name
                    description = event.description
                    if instruction and instruction.is_special and instruction.qualifications.exists():
                        qualifications = instruction.qualifications.values_list('name', flat=True)

                if tour and tour.qualifications.exists():
                    qualifications = tour.qualifications.values_list('name', flat=True)

                s.write(f'\\davTitle{{{cls.texify(title.upper())}}}{cls.RELAX}\n')

                if name:
                    s.write(f'\\davName{{{cls.texify(name)}}}\\par\n')
                else:
                    s.write(f'\\par\n')
                if description:
                    s.write(f'{cls.texify(description)}\\par\n')
                if qualifications:
                    s.write(
                        f'Für die Teilnahme an {"diesem Kurs" if instruction else "dieser Tour"} ist die Beherrschung '
                        f'folgender Kursinhalte Voraussetzung: '
                        f'{", ".join([q for q in qualifications])}\\par\n'
                    )

                lines = []

                if instruction:
                    if event.distal:
                        lines.append(f'\\textbf{{Abfahrt:}} {cls.texify(event.departure())}')
                    else:
                        lines.append(f'\\textbf{{Termin:}} {cls.texify(event.appointment())}')
                    if event.source:
                        lines.append(f'\\textbf{{Ausgangspunkt:}} {cls.texify(event.source)}')
                    if event.location and event.distal:
                        lines.append(
                            f'\\textbf{{{"Übernachtung" if event.end_date else "Ausgangspunkt"}}}: {cls.texify(event.location)}'
                        )

                if tour:
                    preliminary = event.tour._preliminary()
                    if preliminary[0]:
                        lines.append(f'\\textbf{{{preliminary[0]}:}} {preliminary[1]}')
                    lines.append(f'\\textbf{{Abfahrt:}} {cls.texify(event.departure())}')
                    if event.source:
                        lines.append(f'\\textbf{{Ausgangspunkt:}} {cls.texify(event.source)}')
                    if event.location:
                        lines.append(f'\\textbf{{Übernachtung:}} {cls.texify(event.location)}')
                    lines.append(f'\\par\n')

                if lines:
                    s.write(f'{cls.RELAX}\n'.join(lines))
                    s.write(f'\\par\n')

                if instruction and instruction.meeting_list.exists():
                    s.write(f'\\par\n\\textbf{{Weitere Termine:}}{cls.RELAX}\n')
                    s.write(f'{cls.RELAX}\n'.join([cls.texify(e.appointment()) for e in instruction.meeting_list.all()]))
                    s.write('\\par')

                if instruction and not instruction.is_special and event.description:
                    s.write(f'\\par\n{cls.texify(event.description)}\\par\n')

                lines = []
                quantity = event.quantity
                advances = event.advances
                advances_info = event.advances_info
                admission = event.admission
                extra_charges = event.extra_charges
                extra_charges_info = event.extra_charges_info
                distance = event.distance
                guides = event.guides

                if tour and quantity:
                    ladies_only = event.ladies_only
                    minimal = f' mindestens {quantity["min"] if quantity["min"] else ""},'
                    lines.append(
                        f'\\textbf{{Anmeldung:}} bis zum {event.tour._deadline()}, {minimal} maximal {quantity["max"]} '
                        f'{"weibliche " if ladies_only else ""}Teilnehmer'
                    )

                if instruction and quantity:
                    ladies_only = event.ladies_only
                    minimal = f' mindestens {quantity["min"] if quantity["min"] else ""},'
                    lines.append(
                        f'\\textbf{{Teilnehmerzahl:}} {minimal} maximal {quantity["max"]} '
                        f'{"weibliche " if ladies_only else ""}Teilnehmer'
                    )

                if advances:
                    reason = f' für {advances_info}' if advances_info else ''
                    lines.append(f'\\textbf{{Vorauszahlung:}} \EUR{{{int(advances)}}}{cls.texify(reason)}')

                if admission:
                    lines.append(f'\\textbf{{Teilnehmergebühr:}} \EUR{{{int(admission)}}}')

                if extra_charges:
                    reason = f' für {extra_charges_info}' if extra_charges_info else ''
                    lines.append(f'\\textbf{{Zusatzkosten:}} \EUR{{{int(extra_charges)}}}{cls.texify(reason)}')

                if distance:
                    lines.append(
                        f'\\textbf{{Fahrtkostenbeteiligung:}} '
                        f'ca. \EUR{{{int(0.07 * float(distance))}}} für ungefähr {distance} km'
                    )

                if guides:
                    lines.append(f'\\textbf{{Organisation:}} {cls.texify(guides)}')

                if lines:
                    s.write(f'{cls.RELAX}\n'.join(lines))
                    s.write(f'\\par\n')

                if advances:
                    s.write(
                        f'Im Teilnehmerbeitrag von \EUR{{{int(admission)}}} ist eine Vorauszahlung von \EUR{{{int(advances)}}} enthalten. '
                        f'Diese Vorauszahlung wird bei Stornierung der Teilnahme nur zurückerstattet, wenn der freigewordene '
                        f'Platz wieder besetzt werden kann.\\par\n'
                    )

                s.write(f'\\end{{samepage}}\n')
            return s.getvalue()

    def render_source(self):

        with io.StringIO() as s:
            events = set()
            for value in set(self.references):
                try:
                    reference = Reference.get_reference(value)
                except Reference.DoesNotExist:
                    continue
                if reference.deprecated:
                    continue
                event = reference.event
                if event.deprecated:
                    continue
                elif hasattr(event, 'tour') and event.tour.deprecated:
                    continue
                elif hasattr(event, 'meeting') and event.meeting.deprecated:
                    continue
                elif hasattr(event, 'session') and event.session.deprecated:
                    continue
                elif hasattr(event, 'talk') and event.talk.deprecated:
                    continue
                events.add(event.pk)
            if events:
                events = Event.objects.filter(pk__in=events)
                s.write(self.render_events(events))
            else:
                s.write('\\null\n')
            return s.getvalue()

    def render_transformer(self):
        pass

    # graphics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets/graphics'))
    #
    # content = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets/templates/content.tex'))
    # with open(content, 'r', encoding='utf-8') as f:
    #     source = f.read()
    # source = source.replace(
    #     '%%GraphicsPath%%', f'{graphics_path}/'
    # ).replace(
    #   '%%Header%%', Booklet.texify(booklet.header)
    # ).replace(
    #     '%%SubHeader%%', Booklet.texify(booklet.sub_header)
    # ).replace(
    #     '%%MainHeader%%', Booklet.texify(booklet.main_header)
    # ).replace(
    #     '%%Content%%', Booklet.texify(booklet.content)
    # )
    #
    # transform = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets/templates/booklet.tex'))
    # with open(transform, 'r', encoding='utf-8') as f:
    #     transformer = f.read()
    # transformer = transformer.replace(
    #     '%%Author%%', 'WebTool3'
    # ).replace(
    #     '%%Title%%', 'Veranstaltungen 2019'
    # ).replace(
    #     '%%Subject%%', 'Sektion Allgäu-Kempten des Deutschen Alpenvereins e.V.'
    # )
