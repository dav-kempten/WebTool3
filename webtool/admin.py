import datetime
from io import StringIO
import csv

from django.contrib import admin, messages
from django.conf.urls import url
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render
from django.forms import Form, FileField, ModelForm
from django.db.models import Q

from django.contrib.auth.models import Group

from server.models.reference import Reference
from server.models.profile import Profile
from server.models.season import Season
from server.models.instruction import Instruction
from server.models.tour import Tour
from server.models.qualification import UserQualification
from server.models.guide import Guide

from ast import literal_eval


class CsvImportForm(Form):
    csv_file = FileField(label='CSV-Datei')


class JsonImportForm(Form):
    json_file = FileField(label='JSON-Datei')


class SeasonForm(ModelForm):
    class Meta:
        model = Season
        fields = ['name']


class WebtoolAdminSite(admin.AdminSite):
    site_title = 'DAV Allgäu-Kempten'
    change_list_template = 'update_csv.html'

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            url(r'^csv_update/$', self.admin_view(self.csv_update)),
            url(r'^tpo_update/$', self.admin_view(self.tpo_update)),
            url(r'^workload_export/$', self.admin_view(self.workload_export))
        ]
        return my_urls + urls

    def csv_update(self, request):
        if request.method == 'POST' and request.user.is_staff:
            file = request.FILES['csv_file'].read().decode('latin-1')
            if str(request.FILES['csv_file']).split('.')[-1] == 'csv':
                # Update Tours & Instructions
                try:
                    source = self.handle_update(file)
                    messages.success(request, '{}-Update erfolgreich importiert.'.format(source))
                    return HttpResponseRedirect('../')
                except KeyError:
                    messages.error(request, 'Update fehlgeschlagen.')
            else:
                messages.error(request, 'Falsches Datei-Format.')
                return HttpResponseRedirect('../')
        form = CsvImportForm()
        payload = {'form': form}
        return render(
            request, 'csv_form.html', payload
        )

    def tpo_update(self, request):
        if request.method == 'POST' and request.user.is_staff:
            try:
                list_tpo = request.FILES['json_file'].read().decode('latin-1')
                eval_import = literal_eval(list_tpo)
                self.handle_tpo(eval_import)
                messages.success(request, 'TPO-Update erfolgreich importiert.')
                return HttpResponseRedirect('../')
            except SyntaxError:
                messages.error(request, 'Update fehlgeschlagen. Datei nicht kompatibel.')
            except KeyError:
                messages.error(request, 'Update fehlgeschlagen. Datei-Inhalt stimmt nicht mit Datenbank überein.')
        form = JsonImportForm()
        payload = {'form': form}
        return render(
            request, 'tpo_form.html', payload
        )

    def workload_export(self, request):
        if request.method == 'POST' and request.user.is_staff:
            try:
                decode_binary = request.body.decode('utf-8').split('&')
                name_year = ''.join([el for el in decode_binary if 'name' in el])
                year = name_year[len(name_year):name_year.rfind('='):-1][::-1]
                season = Season.objects.get(name=year)
                return self.handle_workload_export(year=year)
            except SyntaxError:
                messages.error(request, 'Export ist fehlgeschlagen, Jahreszahl nicht zuordbar.')
            except (Season.DoesNotExist, TypeError):
                messages.error(request, 'Export ist fehlgeschlagen, bitte andere Jahreszahl wählen.')
        form = SeasonForm()
        payload = {'form': form}
        return render(
            request, 'workload_form.html', payload
        )

    @staticmethod
    def handle_update(file):
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
                cur_quantity = int(row['Gebuchte TN'])
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

    @staticmethod
    def handle_tpo(tpo_json):
        # Get youth-group and flush all user from group
        youth = Group.objects.get(name="Jugend")
        youth.user_set.clear()
        for obj in tpo_json:
            try:
                member_id = obj['membernumber']
                profile_user = Profile.objects.get(member_id=member_id).user
                if profile_user.email.lower() != obj['email'].lower():
                    profile_user.email = obj['email']
                    profile_user.save()
                youth.user_set.add(profile_user)
            except:
                pass

    @staticmethod
    def make_export_list(category=None, event=None, guide=None, field_names=None, preliminary=None):
        row_list = [getattr(guide.user, field) for field in field_names]

        qualification_str = ''
        for qualification in UserQualification.objects.filter(user=guide.user):
            qualification_str += qualification.qualification.code + ', '
        qualification_str = qualification_str[:-2]
        row_list.append(qualification_str)

        if preliminary:
            if preliminary.start_date and preliminary.start_time:
                preliminary_str = str(preliminary.start_date) + ' ' + str(preliminary.start_time)
            elif preliminary.start_date and not preliminary.start_time:
                preliminary_str = str(preliminary.start_date)
        else:
            preliminary_str = ' '

        row_list.extend(
            [event.reference, category.name, event.title, preliminary_str, event.start_date, event.end_date]
        )

        return row_list

    def handle_workload_export(self, year='2021'):
        dstart = year + '-01-01'
        dend = year + '-12-31'

        # Declaring fields for csv-export
        field_names = ['last_name', 'first_name']
        field_names_clear = ['Name', 'Vorname']

        # Additional fields
        field_names_additional = ['Qualifikation', 'Buchungscode', 'Veranstaltung', 'Bezeichnung', 'Vorbesprechung',
                                  'Startdatum', 'Enddatum']

        response = HttpResponse(content_type='text/csv; charset=latin-1')
        content_disposition = 'attachment; filename=workload_' + year + '.csv'
        response['Content-Disposition'] = content_disposition
        writer = csv.writer(response, delimiter=';')

        writer.writerow(field_names_clear + field_names_additional)

        for guide in Guide.objects.all():
            for i in Instruction.objects\
                    .filter(Q(guide=guide) | Q(team=guide))\
                    .filter(instruction__start_date__range=[dstart, dend])\
                    .filter(state__done=True)\
                    .distinct():
                try:
                    if i.topic.category.climbing:
                        # Set end_date of climbing instructions when nothing is defined
                        if i.meeting_list.exists() and not i.instruction.end_date:
                            i.instruction.end_date = i.meeting_list.all().latest().start_date

                        writer.writerow(
                            self.make_export_list(
                                category=i.topic.category,
                                event=i.instruction,
                                guide=guide,
                                field_names=field_names
                            )
                        )
                    else:
                        writer.writerow(
                            self.make_export_list(
                                category=i.topic.category,
                                event=i.instruction,
                                guide=guide,
                                field_names=field_names
                            )
                        )
                        if i.meeting_list.exists():
                            for meeting in i.meeting_list.all():
                                writer.writerow(
                                    self.make_export_list(
                                        category=i.topic.category,
                                        event=meeting,
                                        guide=guide,
                                        field_names=field_names
                                    )
                                )
                except AttributeError:
                    pass

            for t in Tour.objects \
                    .filter(Q(guide=guide) | Q(team=guide)) \
                    .filter(tour__start_date__range=[dstart, dend])\
                    .filter(state__done=True)\
                    .distinct():
                try:
                    writer.writerow(
                        self.make_export_list(
                            category=t.tour.reference.category,
                            event=t.tour,
                            guide=guide,
                            field_names=field_names,
                            preliminary=t.preliminary
                        )
                    )
                except AttributeError:
                    pass
        return response
