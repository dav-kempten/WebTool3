from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _
from django.db.models import Q

from datetime import datetime

from server.models import Qualification, Guide


class QualificationFilter(SimpleListFilter):
    title = _('Trainer-Qualifikationen')
    parameter_name = 'UserQualification'

    tuple_list = []
    for query in Qualification.objects.all():
        short_queryname = query.name\
            .replace("Trainer ", "T")\
            .replace("Fachübungsleiter", "FÜL")\
            .replace("Zusatzqualifikation", "ZQ")
        tuple_list.append((query.code, _(short_queryname)))

    def lookups(self, request, model_admin):
        return self.tuple_list

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(qualification_list__qualification__code=self.value())

class GuideTeamFilter(SimpleListFilter):
    title = _('Veranstaltungsleitung oder Team')
    parameter_name = 'Guide'

    tuple_list=[]
    for query in Guide.objects.all():
        tuple_list.append((query.pk, _(query.name)))

    def lookups(self, request, model_admin):
        return self.tuple_list

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(Q(guide__user__pk=self.value()) | Q(team__user__pk=self.value()))


class ActiveFilter(SimpleListFilter):
    title = _('Status')
    parameter_name = 'is_active'

    tuple_list = (
        ('active', _('Aktiv')),
        ('inactive', _('Inaktiv')),
        ('all', _('Alle')),
    )

    def lookups(self, request, model_admin):
        return self.tuple_list

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(is_active=True)
        elif self.value() == 'inactive':
            return queryset.filter(is_active=False)
        elif self.value() == 'all':
            return queryset.all()
        return queryset.filter(is_active=True)

class CertificateFilter(SimpleListFilter):
    title = _('Führungszeugnis')
    parameter_name = 'Certificate'

    tuple_list = (
        ('required', _('Führungszeugnis erforderlich')),
        ('not required', _('Führungszeugnis nicht erforderlich')),
        ('deprecate this year', _('Führungszeugnis läuft dieses Jahr aus')),
        ('deprecated', _('Führungszeugnis abgelaufen')),
        ('valid', _('Führungszeugnis gültig')),
        ('all', _('Alle')),
    )

    def lookups(self, request, model_admin):
        return self.tuple_list

    def queryset(self, request, queryset):
        if self.value() == 'required':
            return queryset.filter(guide__certificate_required=True)
        elif self.value() == 'not required':
            return queryset.filter(guide__certificate_required=False)
        elif self.value() == 'deprecate this year':
            return (
                queryset.filter(guide__certificate_required=True)
                .filter(guide__certificate=True)
                .filter(guide__certificate_date__lte=datetime(datetime.today().year, 12, 31))
                .filter(guide__certificate_date__gte=datetime(datetime.today().year, 1, 1))
            )
        elif self.value() == 'deprecated':
            return (
                queryset.filter(guide__certificate_required=True)
                .filter(guide__certificate=True)
                .filter(guide__certificate_date__lte=datetime.today())
            )
        elif self.value() == 'valid':
            return (
                queryset.filter(guide__certificate_required=True)
                .filter(guide__certificate=True)
                .filter(guide__certificate_date__gt=datetime.today())
            )
        elif self.value() == 'all':
            return queryset.all()
