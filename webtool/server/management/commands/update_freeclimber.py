# -*- coding: utf-8 -*-
import csv
import io

from django.core.management.base import BaseCommand

from server.models import Reference


class Command(BaseCommand):
    help = 'Update data base with data from the Freeclimber *.csv file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, freeclimber):
        csv_file = csv.DictReader(freeclimber, dialect='excel', delimiter=';')
        for row in csv_file:

            reference_code = row["Nr"]

            try:
                reference = Reference.get_reference(reference_code)
            except Reference.DoesNotExist:
                continue

            print(reference_code)

            cur_quantity = int(row["Ist Teilnehmer"])
            print(cur_quantity)

            event = reference.event
            # print(hasattr(event, 'instruction'))
            print(event.meeting)
            if hasattr(event, 'meeting') and event.meeting:
                instruction = event.meeting
                cq = instruction.cur_quantity
                if cq != cur_quantity:
                    instruction.cur_quantity = cur_quantity
                    instruction.save()
                    print(reference_code, "updated")

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with io.open(path, 'r', encoding='latin-1') as freeclimber_csv:
            self.update(freeclimber_csv)
