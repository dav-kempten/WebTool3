# -*- coding: utf-8 -*-
from datetime import datetime

from django.conf import settings
from django.db import models

from .time_base import TimeMixin
from . import fields, defaults

# (
#     UNKNOWN_QUALIFICATION,
#     SHT,  # Trainer B Skihochtour
#     TCSP,  # Trainer C Sportklettern Breitensport
#     TBSP,  # Trainer B Sportklettern Breitensport
#     TCLS,  # Trainer C Sportklettern Leistungssport
#     TBLS,  # Trainer B Sportklettern Leistungssport
#     FUL_SB,  # Fachübungsleiter Skibergsteigen
#     FUL_SK,  # Fachübungsleiter Skilauf
#     FUL_SLL,  # Fachübungsleiter Skilanglauf
#     FUL_BS,  # Fachübungsleiter Bergsteigen
#     FUL_HT,  # Fachübungsleiter Hochtouren
#     FUL_AK,  # Fachübungsleiter Alpinklettern
#     FUL_MTB,  # Fachübungsleiter Mountainbike
#     JL,  # JDAV-Jugendleiter
#     WL,  # Wanderleiter
#     FGL,  # Familiengruppenleiter
#     ZQ_SSB,  # Zusatzqualifikation Schneeschuhbergsteigen
#     ZQ_EK,  # Zusatzqualifikation Eisfallklettern
#     ZQ_FR,  # Zusatzqualifikation Freeride
#     BSF,  # staatl. gepr. Berg- und Skiführer (UIAGM)
#     SL,  # staatl. gepr. Skilehrer
#     BR,  # Bergrettung
#     AW,  # Anwärter (In Ausbildung)
#     KB,  # Kletterbetreuer Breitensport
#     ZQ_LBS,  # Zusatzqualifikation Leistungsbergsteigen
#     ZQ_RB,  # Zusatzqualifikation Routenbau Breitensport
#     KLA,  # Kletterassistent (Kempten)
#     TCB,  # Trainer C Bergsteigen
#     RB,  # Routenbauer Breitensport
#     TBH,  # Trainer B Hochtouren
#     TBA,  # Trainer B Alpinklettern
#     TBK,  # Trainer B Klettersteig
#     TBP,  # Trainer B Plaisirklettern
#     TBE,  # Trainer B Eisfallklettern
#     TCK,  # Trainer C Kajak
#     TCBW,  # Trainer C Bergwandern
#     FRG,  # Zusatzqualifikation Freeride Guide
#     TCBM,  # Trainer C Klettern für Menschen mit Behinderung
#     TCBO,  # Trainer C Bouldern Breitensport
#     MAX_QUALIFICATION
# ) = range(40)
#
# QUALIFICATION_SHORT_DESCRIPTION = {
#     SHT: 'TBSHT',  # Trainer B Skihochtour
#     TCSP: 'TCSP',  # Trainer C Sportklettern Breitensport
#     TBSP: 'TBSP',  # Trainer B Sportklettern Breitensport
#     TCLS: 'TCLS',  # Trainer C Sportklettern Leistungssport
#     TBLS: 'TBLS',  # Trainer B Sportklettern Leistungssport
#     FUL_SB: 'SB',  # Fachübungsleiter Skibergsteigen
#     FUL_SK: 'SK',  # Fachübungsleiter Skilauf
#     FUL_SLL: 'SLL',  # Fachübungsleiter Skilanglauf
#     FUL_BS: 'BS',  # Fachübungsleiter Bergsteigen
#     FUL_HT: 'HT',  # Fachübungsleiter Hochtouren
#     FUL_AK: 'AK',  # Fachübungsleiter Alpinklettern
#     FUL_MTB: 'MTB',  # Fachübungsleiter Mountainbike
#     JL: 'JL',  # JDAV-Jugendleiter
#     WL: 'WL',  # Wanderleiter
#     FGL: 'FGL',  # Familiengruppenleiter
#     ZQ_SSB: 'SSB',  # Zusatzqualifikation Schneeschuhbergsteigen
#     ZQ_EK: 'EK',  # Zusatzqualifikation Eisfallklettern
#     ZQ_FR: 'FR',  # Zusatzqualifikation Freeride
#     BSF: 'BSF',  # staatl. gepr. Berg- und Skiführer (UIAGM)
#     SL: 'SL',  # staatl. gepr. Skilehrer
#     BR: 'BR',  # Bergrettung
#     AW: 'AW',  # Anwärter (In Ausbildung)
#     KB: 'KB',  # Kletterbetreuer
#     ZQ_LBS: 'LBS',  # Zusatzqualifikation Leistungsbergsteigen
#     ZQ_RB: 'RBB',  # Zusatzqualifikation Routenbau Breitensport
#     KLA: 'KLA',  # Kletterassistent (Kempten)
#     TCB: 'TCB',  # Trainer C Bergsteigen
#     RB: 'RB',  # Routenbauer Breitensport
#     TBH: 'TBH',  # Trainer B Hochtouren
#     TBA: 'TBA',  # Trainer B Alpinklettern
#     TBK: 'TBK',  # Trainer B Klettersteig
#     TBP: 'TBP',  # Trainer B Plaisirklettern
#     TBE: 'TBE',  # Trainer B Eisfallklettern
#     TCK: 'TCK',  # Trainer C Kajak
#     TCBW: 'TCBW',  # Trainer C Bergwandern
#     FRG: 'FRG',  # Zusatzqualifikation Freeride Guide
#     TCBM: 'TCBM',  # Trainer C Klettern für Menschen mit Behinderung
#     TCBO: 'TCBO',  # Trainer C Bouldern Breitensport
# }
#
# QUALIFICATION_DESCRIPTION = {
#     SHT: 'TB Skihochtour',  # Trainer B Skihochtour
#     TCSP: 'TC Sportklettern',  # Trainer C Sportklettern
#     TBSP: 'TB Sportklettern',  # Trainer B Sportklettern
#     TCLS: 'TC Wettkampfklettern',  # Trainer C Wettkampfklettern
#     TBLS: 'TB Wettkampfklettern',  # Trainer B Wettkampfklettern
#     FUL_SB: 'FÜL Skibergsteigen',  # Fachübungsleiter Skibergsteigen
#     FUL_SK: 'FÜL Skilauf',  # Fachübungsleiter Skilauf
#     FUL_SLL: 'FÜL Skilanglauf',  # Fachübungsleiter Skilanglauf
#     FUL_BS: 'FÜL Bergsteigen',  # Fachübungsleiter Bergsteigen
#     FUL_HT: 'FÜL Hochtouren',  # Fachübungsleiter Hochtouren
#     FUL_AK: 'FÜL Alpinklettern',  # Fachübungsleiter Alpinklettern
#     FUL_MTB: 'FÜL Mountainbike',  # Fachübungsleiter Mountainbike
#     JL: 'Jugendleiter',  # JDAV-Jugendleiter
#     WL: 'Wanderleiter',  # Wanderleiter
#     FGL: 'Familiengruppenleiter',  # Familiengruppenleiter
#     ZQ_SSB: 'Schneeschuhbergsteigen',  # Zusatzqualifikation Schneeschuhbergsteigen
#     ZQ_EK: 'Eisfallklettern',  # Zusatzqualifikation Eisfallklettern
#     ZQ_FR: 'Freeride',  # Zusatzqualifikation Freeride
#     BSF: 'Berg- und Skiführer',  # staatl. gepr. Berg- und Skiführer (UIAGM)
#     SL: 'Skilehrer',  # staatl. gepr. Skilehrer
#     BR: 'Bergrettung',  # Bergrettung
#     AW: 'Anwärter',  # Anwärter (In Ausbildung)
#     KB: 'Kletterbetreuer',  # Kletterbetreuer
#     ZQ_LBS: 'Leistungsbergsteigen',  # Zusatzqualifikation Leistungsbergsteigen
#     ZQ_RB: 'Routenbau',  # Zusatzqualifikation Routenbau Breitensport
#     KLA: 'Kletterassistent',  # Kletterassistent (Kempten)
#     TCB: 'TC Bergsteigen',  # Trainer C Bergsteigen
#     RB: 'Routenbauer',  # Routenbauer Breitensport
#     TBH: 'TB Hochtouren',  # Trainer B Hochtouren
#     TBA: 'TB Alpinklettern',  # Trainer B Alpinklettern
#     TBK: 'TB Klettersteig',  # Trainer B Klettersteig
#     TBP: 'TB Plaisirklettern',  # Trainer B Plaisirklettern
#     TBE: 'TB Eisfallklettern',  # Trainer B Eisfallklettern
#     TCK: 'TC Kajak',  # Trainer C Kajak
#     TCBW: 'TC Bergwandern',  # Trainer C Bergwandern
#     FRG: 'Freeride Guide',  # Zusatzqualifikation Freeride Guide
#     TCBM: 'TC Klettern mit Behinderung',  # Trainer C Klettern für Menschen mit Behinderung
#     TCBO: 'TC Bouldern',  # Trainer C Bouldern Breitensport
# }
#
# QUALIFICATION_CHOICES = (
#     ('Trainer', (
#         (TBA, 'Trainer B Alpinklettern'),
#         (TBE, 'Trainer B Eisfallklettern'),
#         (TBH, 'Trainer B Hochtouren'),
#         (TBK, 'Trainer B Klettersteig'),
#         (TBP, 'Trainer B Plaisirklettern'),
#         (SHT, 'Trainer B Skihochtour'),
#         (TBSP, 'Trainer B Sportklettern Breitensport'),
#         (TBLS, 'Trainer B Sportklettern Leistungssport'),
#         (TCB, 'Trainer C Bergsteigen'),
#         (TCSP, 'Trainer C Sportklettern Breitensport'),
#         (TCLS, 'Trainer C Sportklettern Leistungssport'),
#         (TCK, 'Trainer C Kajak'),
#         (TCBW, 'Trainer C Bergwandern'),
#         (TCBM, 'Trainer C Klettern für Menschen mit Behinderung'),
#         (TCBO, 'Trainer C Bouldern Breitensport'),
#     ),
#      ),
#     ('Fachübungsleiter', (
#         (FUL_AK, 'Fachübungsleiter Alpinklettern'),
#         (FUL_BS, 'Fachübungsleiter Bergsteigen'),
#         (FUL_HT, 'Fachübungsleiter Hochtouren'),
#         (FUL_MTB, 'Fachübungsleiter Mountainbike'),
#         (FUL_SB, 'Fachübungsleiter Skibergsteigen'),
#         (FUL_SK, 'Fachübungsleiter Skilauf'),
#         (FUL_SLL, 'Fachübungsleiter Skilanglauf'),
#     ),
#      ),
#     ('Leiter + Zusatzqualifikation', (
#         (JL, 'JDAV-Jugendleiter'),
#         (KB, 'Kletterbetreuer'),
#         (WL, 'Wanderleiter'),
#         (FGL, 'Familiengruppenleiter'),
#         (ZQ_SSB, 'Zusatzqualifikation Schneeschuhbergsteigen'),
#         (ZQ_EK, 'Zusatzqualifikation Eisfallklettern'),
#         (ZQ_FR, 'Zusatzqualifikation Freeride'),
#         (ZQ_LBS, 'Zusatzqualifikation Leistungsbergsteigen'),
#         (ZQ_RB, 'Zusatzqualifikation Routenbau Breitensport'),
#         (FRG, 'Freeride Guide'),
#     )
#      ),
#     ('Berufsausbildungen', (
#         (BSF, 'staatl. gepr. Berg- und Skiführer (UIAGM)'),
#         (SL, 'staatl. gepr. Skilehrer'),
#     ),
#      ),
#     ('Weitere', (
#         (BR, 'Bergrettung'),
#         (AW, 'Anwärter'),
#         (KLA, 'Kletterassistent (Kempten)'),
#     ),
#      ),
# )


class QualificationGroupManager(models.Manager):

    def get_by_natural_key(self, name):
        return self.get(name=name)


class QualificationGroup(TimeMixin, models.Model):

    name = fields.NameField(
        help_text="Bezeichnung der Qualifikationsgruppe",
        unique=True
    )

    order = fields.OrderField()

    def natural_key(self):
        return self.name,

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Qualifikationsgruppe"
        verbose_name_plural = "Qualifikationsgruppen"
        ordering = ('order', 'name')


class QualificationManager(models.Manager):

    def get_by_natural_key(self, code):
        return self.get(code=code)


class Qualification(TimeMixin, models.Model):

    code = models.CharField(
        'Kurzzeichen',
        primary_key=True,
        max_length=10,
        help_text="Kurzzeichen der Qualifikation",
    )

    name = fields.NameField(
        help_text="Bezeichnung der Qualifikation",
    )

    order = fields.OrderField()

    group = models.ForeignKey(
        'QualificationGroup',
        db_index=True,
        related_name='qualifications',
        on_delete=models.PROTECT,
        blank=True, null=True
    )

    def natural_key(self):
        return self.code,

    def __str__(self):
        return "{} ({})".format(self.name, self.code)

    class Meta:
        verbose_name = "Qualifikation"
        verbose_name_plural = "Qualifikationen"
        unique_together = (('code', 'name'), ('code', 'group'))
        ordering = ('order', 'code', 'name')


class UserQualificationManager(models.Manager):

    def get_by_natural_key(self, username, qualification, year):
        return self.get(user__username=username, qualification__code=qualification, year=year)


class UserQualification(TimeMixin, models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        db_index=True,
        related_name='qualification_list',
        on_delete=models.PROTECT
    )

    qualification = models.ForeignKey(
        'Qualification',
        db_index=True,
        related_name='user_list',
        on_delete=models.PROTECT
    )

    aspirant = models.BooleanField(
        "Anwärter",
        default=False,
        help_text="Die Qualifikation wurde noch nicht erworben",
    )

    year = models.PositiveSmallIntegerField(
        "Jahr",
        default=defaults.get_default_year,
        help_text="Das Jahr, in dem die Ausbildung abgeschlossen wurde",
    )

    inactive = models.BooleanField(
        "Keine Fortbildung notwendig",
        default=False,
    )

    note = models.TextField(
        "Notizen",
        blank=True, default='',
        help_text="Raum für interne Notizen",
    )

    def natural_key(self):
        return self.user.get_username(), self.qualification.code, self.year

    natural_key.dependencies = ['auth.user', 'server.qualification']

    def __str__(self):
        return "{}'s {} von {}".format(self.user.get_full_name(), self.qualification.name, self.year)

    class Meta:
        unique_together = ('user', 'qualification', 'year')
        ordering = ('year', 'qualification__order')
