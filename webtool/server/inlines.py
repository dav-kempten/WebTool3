from django.contrib import admin
from django.contrib.auth.admin import User

from server.models.retraining import Retraining
from server.models.profile import Profile
from server.models.collective import Role
from server.models.qualification import UserQualification
from server.models.guide import Guide


class GuideInline(admin.StackedInline):
    model = Guide
    # fields = ('unknown', 'profile', 'phone', 'mobile', 'email', 'portrait')
    extra = 0
    verbose_name = 'Trainer-Profil'
    verbose_name_plural = 'Trainer-Profil'
    classes = ['collapse']


class ProfileInline(admin.StackedInline):
    model = Profile
    extra = 0
    # readonly_fields = ['member_id', 'birth_date', 'phone', 'mobile']
    verbose_name = 'Nutzer-Profil'
    verbose_name_plural = 'Nutzer-Profil'
    classes = ['collapse']


class QualificationInline(admin.StackedInline):
    model = UserQualification
    can_delete = True
    extra = 0
    verbose_name = "Ausbildung"
    verbose_name_plural = "Ausbildungen"
    classes = ['collapse']


class RetrainingInline(admin.StackedInline):
    model = Retraining
    can_delete = True
    extra = 0
    verbose_name = "Fortbildung"
    verbose_name_plural = "Fortbildungen"
    classes = ['collapse']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'qualification':
            try:
                user_pk = int(request.META.get('PATH_INFO').split('/')[4])
                kwargs["queryset"] = UserQualification.objects.filter(user__pk=user_pk)
            except ValueError:
                pass
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class RoleInline(admin.StackedInline):
    model = Role
    can_delete = True
    extra = 0
    verbose_name = 'Rolle'
    verbose_name_plural = 'Rollen'
    classes = ['collapse']
