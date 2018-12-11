# -*- coding: utf-8 -*-
import uuid

from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField

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

    @property
    def _tex_filename(self):
        return f"{settings.MEDIA_ROOT}/tex/{self.pk}.tex"

    @property
    def pdf_filename(self):
        return f"{settings.MEDIA_ROOT}/booklets/{self.pk}.pdf"

    def render_tex(self):

        print(self.header)
        print(self.sub_header)
        print(self.main_header)
        for code in self.references:
            print(code)

        return (
            r"""
            \documentclass[paper=a5, ngerman, fontsize=9pt, pagesize, twoside, footwidth=:-130mm:-120.4mm, parskip=half-]{scrreprt}
            \usepackage[default,regular,bold,osf]{sourceserifpro}
            \usepackage[T1]{fontenc}
            \usepackage{scrlayer-scrpage}
            \usepackage{setspace}
            \usepackage{ragged2e}
            \usepackage[inner=36.7mm,outer=10mm,bottom=25.7mm,top=10mm]{geometry}
            \usepackage[utf8]{inputenc}
            \usepackage{soulutf8}
            \usepackage{babel}
            \usepackage{eurosym}
            \usepackage{pdfpages}
            \usepackage{background}
            \begin{document}
            Das ist ein Test!
            \end{document}
            """
        )
