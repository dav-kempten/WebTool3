from django.contrib.admin import SimpleListFilter
from django.utils.translation import gettext_lazy as _
from django.db.models import Q

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
