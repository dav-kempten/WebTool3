# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.postgres import fields as postgres

from . import fields, defaults


class SeasonMixin(models.Model):

    # noinspection PyUnresolvedReferences
    season = models.ForeignKey(
        'Season',
        db_index=True,
        verbose_name='Saison',
        related_name='%(class)s_list',
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_season
    )

    class Meta:
        abstract = True


class PartMixin(models.Model):

    # noinspection PyUnresolvedReferences
    part = models.ForeignKey(
        'Part',
        db_index=True,
        verbose_name='Abschnitt',
        related_name='%(class)s_list',
        on_delete=models.PROTECT,
    )

    class Meta:
        abstract = True


class SectionMixin(models.Model):

    # noinspection PyUnresolvedReferences
    section = models.ForeignKey(
        'Section',
        db_index=True,
        verbose_name='Unterabschnitt',
        related_name='%(class)s_list',
        on_delete=models.PROTECT,
    )

    class Meta:
        abstract = True


class ChapterMixin(models.Model):

    # noinspection PyUnresolvedReferences
    chapter = models.ManyToManyField(
        'Chapter',
        db_index=True,
        verbose_name='Kapitel',
        related_name='%(class)s_list',
    )

    class Meta:
        abstract = True


class DescriptionMixin(models.Model):

    title = fields.TitleField(db_index=True)
    name = fields.NameField(db_index=True)
    description = fields.DescriptionField(blank=True, default='')

    cover = models.FileField(
        'Titelbild',
        blank=True, default='',
        help_text="Eine URL zu einem Bild welches die Veranstaltung charakterisiert",
    )

    internal = models.BooleanField(
        'Interne Veranstaltung',
        blank=True, default=False
    )

    class Meta:
        abstract = True


class GuidedEventMixin(models.Model):

    # noinspection PyUnresolvedReferences
    guide = models.ForeignKey(
        'Guide',
        db_index=True,
        verbose_name='Leitung',
        related_name='%(class)s_guides',
        help_text="Verantwortlich für Organisaton und Durchführung",
        on_delete=models.PROTECT,
    )

    # noinspection PyUnresolvedReferences
    team = models.ManyToManyField(
        'Guide',
        db_index=True,
        verbose_name='Team',
        related_name='%(class)s_teamers',
        blank=True,
        help_text="Mitglieder im Leitungsteam",
    )

    class Meta:
        abstract = True

    def guides(self):
        guides = [self.guide]
        guides.extend(self.team.all())
        guides = ', '.join([g.name for g in guides])
        return guides.replace('Unbekannt', 'DAV-Trainer')


class StateMixin(models.Model):

    # noinspection PyUnresolvedReferences
    state = models.ForeignKey(
        'State',
        db_index=True,
        verbose_name='Bearbeitungsstand',
        related_name='%(class)s_list',
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_state
    )

    class Meta:
        abstract = True


class AdminMixin(StateMixin, models.Model):

    calc_budget = models.DecimalField(
        'Budget',
        max_digits=6, decimal_places=2,
        blank=True, default=0.0,
        help_text="Geplanter Betrag in €, der vom Team in Summe abgerechnet wird",
    )

    real_costs = models.DecimalField(
        'Abrechnung',
        max_digits=6, decimal_places=2,
        blank=True, default=0.0,
        help_text="Tatsächlicher Betrag in €, der vom Team in Summe abgerechnet wurde",
    )

    budget_info = postgres.JSONField(blank=True, null=True)  # JSON data as base for calculation of budget
    message = models.TextField(blank=True, default='')  # Info vom Guide an Referat
    comment = models.TextField(blank=True, default='')  # Interna!

    class Meta:
        abstract = True


class EquipmentMixin(models.Model):

    # noinspection PyUnresolvedReferences
    equipments = models.ManyToManyField(
        'Equipment',
        db_index=True,
        related_name='%(class)s_list',
        verbose_name='Ausrüstung',
        blank=True, default=defaults.get_default_equipment_list
    )

    misc_equipment = fields.MiscField(
        help_text="Zusätzliche Ausrüstung, wenn unter Ausrüstung „Sonstiges“ gewählt wurde",
    )

    class Meta:
        abstract = True

    def equipment_list(self):
        equipment_list = list(self.equipments.exclude(code='?').values_list('code', flat=True))
        if self.equipments.filter(code='?').exists() and self.misc_equipment:
            equipment_list.append(self.misc_equipment)
        return ', '.join(equipment_list)


class AdmissionMixin(models.Model):

    admission = fields.AdmissionField(
        verbose_name='Beitrag für Mitglieder',
        help_text="Teilnehmerbeitrag in €"
    )

    advances = fields.AdmissionField(
        verbose_name='Vorauszahlung',
        help_text="Im Beitrag enthaltene Vorauszahlungen oder Stornogebühren in €",
    )

    advances_info = fields.InfoField(
        'Info',
        help_text="Begründung für die Vorrauszahlung",
    )

    extra_charges = models.CharField(
        'Zusatzkosten',
        blank=True, default='',
        max_length=75,
        help_text="Welche weiteren Kosten kommen auf die Teilnehmer zu? z.B. Kosten für Seilbahn",
    )

    min_quantity = models.PositiveIntegerField(
        'Min. Tln',
        blank=True, default=0,
        help_text="Wieviel Teilnehemr müssen mindestens teilnehmen",
    )

    max_quantity = models.PositiveIntegerField(
        'Max. Tln',
        help_text="Wieviel Teilnehemr dürfen mit",
    )

    cur_quantity = models.PositiveIntegerField(
        'Anmeldungen',
        blank=True, default=0,
        help_text="Wieviel Teilnehemr sind aktuell dabei",
    )

    class Meta:
        abstract = True


class RequirementMixin(models.Model):

    # noinspection PyUnresolvedReferences
    skill = models.ForeignKey(
        'Skill',
        db_index=True,
        verbose_name='Technik',
        related_name='%(class)s_list',
        help_text="Technische Anforderungen",
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_skill
    )

    # noinspection PyUnresolvedReferences
    fitness = models.ForeignKey(
        'Fitness',
        db_index=True,
        verbose_name='Kondition',
        related_name='%(class)s_list',
        help_text="Konditionelle Anforderungen",
        on_delete=models.PROTECT,
        blank=True, default=defaults.get_default_fitness
    )

    class Meta:
        abstract = True


class QualificationMixin(models.Model):

    # noinspection PyUnresolvedReferences
    qualifications = models.ManyToManyField(
        'Topic',
        db_index=True,
        verbose_name='Voraussetzungen (Kurse)',
        related_name='%(class)s_list',
        blank=True,
        help_text="Welche Kurseinhalte müssen von den Teilnahmern für den Kurs beherrscht werden",
    )

    preconditions = models.TextField(
        'Voraussetzung',
        blank=True, default='',
        help_text="Sonstige, spezielle Vorraussetzungen für eine Teilnahme an diesem Kurs",
    )

    class Meta:
        abstract = True

    def qualification_list(self):
        qualifications = list(self.qualifications.all().values_list('title', flat=True))
        return ", ".join(qualifications)
