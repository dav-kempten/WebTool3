from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, Group

import csv
import json
from io import StringIO
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import path
from django.forms import Form, FileField
from django.shortcuts import render
from django.contrib import messages
from server.models.retraining import Retraining
from server.models.qualification import UserQualification
from server.models.profile import Profile
from server.models.reference import Reference

from server.inlines import GuideInline, ProfileInline, QualificationInline, RetrainingInline
from server.admin_filters import QualificationFilter


class CsvImportForm(Form):
    csv_file = FileField()


class UserAdmin(BaseUserAdmin):
    change_list_template = 'update_csv.html'

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

    actions = ['export_as_csv', 'export_as_json', 'email_for_cleverreach', 'email_as_plain', 'add_to_group_gs', 'add_to_group_summer',
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
                date_list = str(profile.birth_date).split('-')
                birthdate = date_list[2] + '.' + date_list[1] + '.' + date_list[0]
            except:
                birthdate = ''
            row_list.append(birthdate)

            # Prepare Groups for each User
            group_str = ''
            for group in Group.objects.filter(user=obj):
                group_str += group.name + ', '
            group_str = group_str[:-2]
            row_list.append(group_str)

            # Prepare UserQualification for each User
            qualification_str = ''
            for qualification in UserQualification.objects.filter(user=obj):
                qualification_str += qualification.qualification.code + ', '
            qualification_str = qualification_str[:-2]
            row_list.append(qualification_str)

            row = writer.writerow(row_list)

        return response

    def export_as_json(self, request, queryset):
        user_dicts = []

        for user in queryset:
            try:
                profile_id = Profile.objects.get(user=user).member_id
            except:
                profile_id = ''

            if user.first_name and user.last_name and profile_id:
                train_list = []
                train_order_list = []
                for user_training in UserQualification.objects.filter(user=user):
                    train_list.append(user_training.qualification.code)
                    train_order_list.append(user_training.qualification.order)
                if len(train_order_list) == 0:
                    train_code = ''
                else:
                    train_code = train_list[train_order_list.index(min(train_order_list))]
                user_dicts.append({'Vorname': user.first_name, 'Nachname': user.last_name, 'Qualifikation': train_code,
                                   'Mitgliedsnummer': profile_id})

        json_list = json.dumps(user_dicts, ensure_ascii=False).encode('utf8')

        response = HttpResponse(content_type='text/plain; charset=utf-8', content=json_list)
        response['Content-Disposition'] = 'attachment; filename=user_sum.json'

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
    export_as_json.short_description = 'JSON-Export'
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
                qual = UserQualification.objects.get(pk=retrai.qualification.pk)
                retrai_string = retrai_string + qual.qualification.code + '(' + str(retrai.year)
                if retrai.specific:
                    retrai_string = retrai_string + '-FS'
                retrai_string = retrai_string + '), '

        if len(retrai_string) > 2:
            retrai_string = retrai_string[:-2]
        return retrai_string

    get_userRetraining.short_description = 'Fortbildungen'

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('kv_update/', self.kv_update)
        ]
        return my_urls + urls

    def kv_update(self, request):
        if request.method == 'POST':
            file = request.FILES['csv_file'].read().decode('latin-1')
            # Update Tours & Instructions
            try:
                source = self.handle_update(file)
                self.message_user(request, '{}-Update erfolgreich importiert.'.format(source))
            except KeyError:
                messages.error(request, 'Update fehlgeschlagen.')
            return HttpResponseRedirect('../')
        form = CsvImportForm()
        payload = {'form': form}
        return render(
            request, 'csv_form.html', payload
        )

    def handle_update(self, file):
        data = csv.DictReader(StringIO(file), dialect='excel', delimiter=';')
        kvm = False
        for row in data:

            reference_code = row.get('Kursnummer')
            if reference_code is None:
                kvm = False
                reference_code = row.get('Nr')
            else:
                kvm = True
            if reference_code is None:
                continue

            try:
                reference = Reference.get_reference(reference_code)
            except Reference.DoesNotExist:
                continue

            if reference.deprecated:
                continue

            event = reference.event
            if event is None:
                continue

            if kvm:
                cur_quantity = int(row['GebuchteTN'])
            else:
                cur_quantity = int(row['Ist Teilnehmer'])

            if hasattr(event, 'tour') and event.tour:
                tour = event.tour
                cq = tour.cur_quantity
                if cq != cur_quantity:
                    tour.cur_quantity = cur_quantity
                    event.new = False
                    event.save()
                    tour.save()
            if hasattr(event, 'talk') and event.talk:
                talk = event.talk
                cq = talk.cur_quantity
                if cq != cur_quantity:
                    talk.cur_quantity = cur_quantity
                    talk.save()
            if hasattr(event, 'meeting') and event.meeting:
                instruction = event.meeting
                cq = instruction.cur_quantity
                if cq != cur_quantity:
                    instruction.cur_quantity = cur_quantity
                    event.new = False
                    event.save()
                    instruction.save()

        if kvm:
            return 'KV'
        else:
            return 'Freeclimber'
