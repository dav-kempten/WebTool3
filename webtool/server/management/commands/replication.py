# -*- coding: utf-8 -*-
import csv
import io

from django.core.management.base import BaseCommand

from server.models import Reference


class Command(BaseCommand):
    help = 'Update data base with data from the DAV KV_Manager *.csv file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, kvm):
        csv_file = csv.DictReader(kvm, dialect='excel', delimiter=';')
        for row in csv_file:

            reference_code = row["Kursnummer"]

            try:
                reference = Reference.get_reference(reference_code)
            except Reference.DoesNotExist:
                continue

            print(reference_code)

            cur_quantity = int(row["GebuchteTN"])

            event = reference.event
            if hasattr(event, 'tour') and event.tour:
                tour = event.tour
                cq = tour.cur_quantity
                if cq != cur_quantity:
                    tour.cur_quantity = cur_quantity
                    tour.save()
                    print(reference_code, "updated")
            if hasattr(event, 'talk') and event.talk:
                talk = event.talk
                cq = talk.cur_quantity
                if cq != cur_quantity:
                    talk.cur_quantity = cur_quantity
                    talk.save()
                    print(reference_code, "updated")
            if hasattr(event, 'meeting') and event.meeting:
                instruction = event.meeting
                cq = instruction.cur_quantity
                cm = instruction.max_quantity
                if cq != cur_quantity:
                    instruction.cur_quantity = cur_quantity
                    instruction.save()
                    print(reference_code, "updated")

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with io.open(path, 'r', encoding='latin-1') as kvm_csv:
            self.update(kvm_csv)
