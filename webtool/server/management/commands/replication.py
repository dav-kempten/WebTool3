# -*- coding: utf-8 -*-
import csv
import io

from django.core.management.base import BaseCommand

from server.models import Reference


class Command(BaseCommand):
    help = 'Update data base with data from DAV KV_Manager or FreeClimber *.csv file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, csv_file):
        csv_dict = csv.DictReader(csv_file, dialect='excel', delimiter=';')
        for row in csv_dict:

            reference_code = row.get("Kursnummer")
            if reference_code is None:
                kvm = False
                reference_code = row.get("Nr")
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

            print(reference_code)

            if kvm:
                cur_quantity = int(row["GebuchteTN"])
            else:
                cur_quantity = int(row["Ist Teilnehmer"])

            updated = False
            if hasattr(event, 'tour') and event.tour:
                tour = event.tour
                cq = tour.cur_quantity
                if cq != cur_quantity:
                    tour.cur_quantity = cur_quantity
                    event.new = False
                    event.save()
                    tour.save()
                    updated = True
            if hasattr(event, 'talk') and event.talk:
                talk = event.talk
                cq = talk.cur_quantity
                if cq != cur_quantity:
                    talk.cur_quantity = cur_quantity
                    talk.save()
                    updated = True
            if hasattr(event, 'meeting') and event.meeting:
                instruction = event.meeting
                cq = instruction.cur_quantity
                if cq != cur_quantity:
                    instruction.cur_quantity = cur_quantity
                    event.new = False
                    event.save()
                    instruction.save()
                    updated = True

            if updated:
                print(reference_code, "updated")

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with io.open(path, 'r', encoding='latin-1') as csv_file:
            self.update(csv_file)
