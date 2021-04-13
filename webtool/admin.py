from io import StringIO
import csv

from django.contrib import admin, messages
from django.conf.urls import url
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.forms import Form, FileField

from server.models.reference import Reference


class CsvImportForm(Form):
    csv_file = FileField(label='CSV-Datei')


class WebtoolAdminSite(admin.AdminSite):
    site_title = 'DAV Allgäu-Kempten'
    change_list_template = 'update_csv.html'

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            url(r'^csv_update/$', self.admin_view(self.csv_update))
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
                except KeyError:
                    messages.error(request, 'Update fehlgeschlagen.')
                return HttpResponseRedirect('../')
            else:
                messages.error(request, 'Falsches Datei-Format.')
                return HttpResponseRedirect('../')
        form = CsvImportForm()
        payload = {'form': form}
        return render(
            request, 'csv_form.html', payload
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
