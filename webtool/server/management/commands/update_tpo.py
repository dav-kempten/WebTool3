import io
import json

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from server.models import Profile


class Command(BaseCommand):
    help = 'Update database with data from a *.json file from TPO'

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, tpo_json):
        for obj in tpo_json:
            try:
                member_id = obj['membernumber']
                profile_user = Profile.objects.get(member_id=member_id).user
                if profile_user.email.lower() != obj['email'].lower():
                    print('E-Mail TPO: {}, E-Mail Webtool: {}'.format(obj['email'], profile_user.email))
                    profile_user.email = obj['email']
                    profile_user.save()
            except:
                print('Member_Id from {} cannot be found.'.format((obj['name']+' '+obj['surname'])))

    def add_arguments(self, parser):
        parser.add_argument('data', type=str)

    def handle(self, *args, **options):
        path = options['data']
        with open(path) as json_file:
            tpo_json = json.load(json_file)
            self.update(tpo_json)
