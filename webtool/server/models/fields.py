# -*- coding: utf-8 -*-
from django.db import models


class TitleField(models.CharField):

    def __init__(self,
                 verbose_name='Kurztitel',
                 max_length=30,
                 help_text="Das ist der Titel im Kalender",
                 *args, **kwargs
                 ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name,
            max_length=max_length,
            help_text=help_text, *args, **kwargs
        )


class NameField(models.CharField):

    def __init__(
            self,
            verbose_name='Bezeichnung',
            max_length=125,
            help_text="Das ist der Titel für's Programm",
            *args, **kwargs
    ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name,
            max_length=max_length,
            help_text=help_text, *args, **kwargs
        )


class DescriptionField(models.TextField):

    def __init__(
            self,
            verbose_name='Beschreibung',
            help_text="Beschreibung der Veranstaltung und der geplanten Abläufe\n"
                      "Sonderzeichen: ● ○ ➘ ➚ „“ ½ ⅓ ⅔ ¼ ¾",
            *args, **kwargs
    ):

        super(self.__class__, self).__init__(verbose_name=verbose_name, help_text=help_text, *args, **kwargs)


class AdmissionField(models.DecimalField):

    def __init__(
            self,
            verbose_name=None,
            max_digits=6, decimal_places=2,
            blank=True, default=0.0,
            help_text=None,
            *args, **kwargs
    ):
        super(self.__class__, self).__init__(
            verbose_name=verbose_name,
            max_digits=max_digits, decimal_places=decimal_places,
            blank=blank, default=default,
            help_text=help_text, *args, **kwargs)


class MiscField(models.CharField):

    def __init__(
            self,
            verbose_name='Sonstiges',
            max_length=75,
            blank=True, default='',
            help_text=None, *args, **kwargs
    ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name,
            max_length=max_length,
            blank=blank, default=default,
            help_text=help_text, *args, **kwargs
        )


class InfoField(models.CharField):

    def __init__(
            self,
            verbose_name='Info',
            max_length=75,
            blank=True, default='',
            help_text=None, *args, **kwargs
    ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name,
            max_length=max_length,
            blank=blank, default=default,
            help_text=help_text, *args, **kwargs
        )


class LocationField(models.CharField):

    def __init__(self,
                 verbose_name=None,
                 max_length=75,
                 blank=True, default='',
                 *args, **kwargs
                 ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name, max_length=max_length, blank=blank, default=default, *args, **kwargs
        )


class DistanceField(models.PositiveIntegerField):
    def __init__(self,
                 verbose_name='Entfernung',
                 help_text="Kempten (Treffpunkt) → Ausgangsort",
                 blank=True, default=0,
                 *args, **kwargs
                 ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name, help_text=help_text, blank=blank, default=default, *args, **kwargs
        )


class OrderField(models.PositiveSmallIntegerField):
    def __init__(self,
                 verbose_name='Reihenfolge',
                 help_text="Reihenfolge in der Druckausgabe",
                 blank=True, default=0,
                 db_index=True,
                 *args, **kwargs
                 ):

        super(self.__class__, self).__init__(
            verbose_name=verbose_name, help_text=help_text,
            blank=blank, default=default, db_index=db_index,
            *args, **kwargs
        )
