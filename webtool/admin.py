from io import StringIO
import csv

from django.contrib import admin, messages
from django.conf.urls import url
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.forms import Form, FileField

from django.contrib.auth.models import Group
from server.models.reference import Reference
from server.models.profile import Profile

from ast import literal_eval


class CsvImportForm(Form):
    csv_file = FileField(label='CSV-Datei')


class JsonImportForm(Form):
    json_file = FileField(label='JSON-Datei')


class WebtoolAdminSite(admin.AdminSite):
    site_title = 'DAV Allgäu-Kempten'
    change_list_template = 'update_csv.html'

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            url(r'^csv_update/$', self.admin_view(self.csv_update)),
            url(r'^tpo_update/$', self.admin_view(self.tpo_update))
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