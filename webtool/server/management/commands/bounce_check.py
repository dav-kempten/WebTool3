# -*- coding: utf-8 -*-
import csv
import io

from django.core.management.base import BaseCommand

from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Check if user-email comes in *.csv bounce-file'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, csv_file):
        csv_dict = csv.DictReader(csv_file, dialect='excel', delimiter=';')
        for row in csv_dict:
            for u in User.objects.all():
                email = row.get("email")
                if u.email.lower() == email.lower():
                    print('{}, {}'.format(u.last_name, u.first_name))

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with io.open(path, 'r', encoding='latin-1') as csv_file:
            self.update(csv_file)
