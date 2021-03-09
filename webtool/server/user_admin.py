from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, Group

import csv
from django.http import HttpResponse
from server.models.retraining import Retraining
from server.models.qualification import UserQualification
from server.models.profile import Profile

from server.inlines import GuideInline, ProfileInline, QualificationInline, RetrainingInline
from server.admin_filters import QualificationFilter


class UserAdmin(BaseUserAdmin):
    fieldsets = (
        ('Login', {
            'classes': ['collapse'],
            'fields': ('username', 'password',)
        }),
        ('Admin', {
            'classes': ['collapse'],
            'fields': ('is_active', 'is_staff', 'is_superuser', 'user_permissions', 'date_joined', 'last_login',)
        }),
        (None, {
            'fields': ('first_name', 'last_name', 'email', 'groups',)
        }),
    )
    readonly_fields = ['password']
    inlines = (GuideInline, ProfileInline, QualificationInline, RetrainingInline,)
    ordering = ('last_name', 'first_name')

    actions = ['export_as_csv', 'email_for_cleverreach', 'email_as_plain', 'add_to_group_gs', 'add_to_group_summer',
               'add_to_group_winter', 'add_to_group_climbing', 'add_to_group_youth', 'add_to_group_leberkas',
               'add_to_group_helpinghands', 'remove_from_gs', 'remove_from_group_summer', 'remove_from_group_winter',
               'remove_from_group_climbing', 'remove_from_group_youth', 'remove_from_group_leberkas',
               'remove_from_group_helpinghands', ]

    list_filter = ('is_staff', 'is_active', 'groups', QualificationFilter)

    def export_as_csv(self, request, queryset):
        meta = self.model._meta

        # Field-Names and their better looking brothers
        field_names = ['first_name', 'last_name', 'email']
        field_names_clear = ['Vorname', 'Nachname', 'E-Mail']

        # Additional Fields, which are connected to User-Model
        field_names_additional = ['Geburtstag', 'Gruppen', 'Ausbildungen']

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(meta)
        writer = csv.writer(response)

        writer.writerow(field_names_clear + field_names_additional)
        for obj in queryset:
            row_list = [getattr(obj, field) for field in field_names]

            # Prepare Birthdate for each User
            try:
                profile = Profile.objects.get(user=obj)
                date_list = str(profile.birth_date).split("-")
                birthdate = date_list[2] + "." + date_list[1] + '.' + date_list[0]
            except:
                birthdate = ''
            row_list.append(birthdate)

            # Prepare Groups for each User
            group_str = ''
            for group in Group.objects.filter(user=obj):
                group_str += group.name + ", "
            group_str = group_str[:-2]
            row_list.append(group_str)

            # Prepare UserQualification for each User
            qualification_str = ''
            for qualification in UserQualification.objects.filter(user=obj):
                qualification_str += qualification.qualification.code + ", "
            qualification_str = qualification_str[:-2]
            row_list.append(qualification_str)

            row = writer.writerow(row_list)

        return response

    def email_for_cleverreach(self, request, queryset):
        list = []

        for user in queryset:
            if user.email and user.first_name and user.last_name:
                list.append(user.email + ';' + user.first_name + ';' + user.last_name + '\n')

        response = HttpResponse(content_type='text/plain; charset=utf-8', content=list)

        return response

    def email_as_plain(self, request, queryset):
        list = []

        for user in queryset:
            if user.email:
                list.append(user.first_name + ' ' + user.last_name + ' <' + user.email + '>\n')

        response = HttpResponse(content_type='text/plain; charset=utf-8', content=list)

        return response

    export_as_csv.short_description = 'Excel-Export'
    email_for_cleverreach.short_description = 'CleverReach-Export'
    email_as_plain.short_description = 'Email-Export'

    def add_to_group_gs(self, request, queryset):
        group = Group.objects.get(name='Geschäftsstelle')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_summer(self, request, queryset):
        group = Group.objects.get(name='FB Sommer')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_winter(self, request, queryset):
        group = Group.objects.get(name='FB Winter')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_youth(self, request, queryset):
        group = Group.objects.get(name='Jugend')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_climbing(self, request, queryset):
        group = Group.objects.get(name='FB Klettern')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_leberkas(self, request, queryset):
        group = Group.objects.get(name='Leberkäsessen')
        for user in queryset:
            group.user_set.add(user)

    def add_to_group_helpinghands(self, request, queryset):
        group = Group.objects.get(name='Helfer-Pool')
        for user in queryset:
            group.user_set.add(user)

    add_to_group_gs.short_description = 'Zur Gruppe Geschäftsstelle hinzufügen'
    add_to_group_summer.short_description = 'Zum FB Sommer hinzufügen'
    add_to_group_winter.short_description = 'Zum FB Winter hinzufügen'
    add_to_group_climbing.short_description = 'Zum FB Klettern hinzufügen'
    add_to_group_youth.short_description = 'Zur Jugend hinzufügen'
    add_to_group_leberkas.short_description = 'Zum Leberkäsessen hinzufügen'
    add_to_group_helpinghands.short_description = 'Zum Helfer-Pool hinzufügen'

    def remove_from_gs(self, request, queryset):
        group = Group.objects.get(name='Geschäftsstelle')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_summer(self, request, queryset):
        group = Group.objects.get(name='FB Sommer')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_winter(self, request, queryset):
        group = Group.objects.get(name='FB Winter')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_climbing(self, request, queryset):
        group = Group.objects.get(name='FB Klettern')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_youth(self, request, queryset):
        group = Group.objects.get(name='Jugend')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_leberkas(self, request, queryset):
        group = Group.objects.get(name='Leberkäsessen')
        for user in queryset:
            group.user_set.remove(user)

    def remove_from_group_helpinghands(self, request, queryset):
        group = Group.objects.get(name='Helfer-Pool')
        for user in queryset:
            group.user_set.remove(user)

    remove_from_gs.short_description = 'Von Gruppe Geschäftsstelle entfernen'
    remove_from_group_summer.short_description = 'Von FB Sommer entfernen'
    remove_from_group_winter.short_description = 'Von FB Winter entfernen'
    remove_from_group_climbing.short_description = 'Von FB Klettern entfernen'
    remove_from_group_youth.short_description = 'Aus Jugend entfernen'
    remove_from_group_leberkas.short_description = 'Von Leberkäsessen entfernen'
    remove_from_group_helpinghands.short_description = 'Von Helfer-Pool entfernen'

    list_display = ('username', 'first_name', 'last_name', 'email', 'get_userQualification', 'get_userRetraining')

    def get_userQualification(self, obj):
        qual_string = ''
        for qual in UserQualification.objects.filter(user=obj):
            qual_string = qual_string + qual.qualification.code + '(' + str(qual.year) + '), '
        qual_string = qual_string[:-2]
        return qual_string

    get_userQualification.short_description = 'Ausbildungen'

    def get_userRetraining(self, obj):
        retrai_string = ''
        for retrai in Retraining.objects.filter(user=obj):
            if retrai.qualification is not None:
                qual = UserQualification.objects.get(pk = retrai.qualification.pk)
                retrai_string = retrai_string + qual.qualification.code + '(' + str(retrai.year)
                if retrai.specific:
                    retrai_string = retrai_string + '-FS'
                retrai_string = retrai_string + '), '

        if len(retrai_string) > 2:
            retrai_string = retrai_string[:-2]
        return retrai_string

    get_userRetraining.short_description = 'Fortbildungen'