from django.core.management.base import BaseCommand

from server.models import Tour, Instruction

class Command(BaseCommand):
    help = "Enable all tours & instruction with state_id=9 (not able to book) from specific season"

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    def update(self, season):
        # lowercase string for better input-handling
        if season.lower() == 'winter':
            for t in Tour.objects.filter(tour__reference__category__winter=True).filter(state_id=9):
                t.state_id = 5
                t.save()

            for i in Instruction.objects.filter(instruction__reference__category__winter=True).filter(state_id=9):
                i.state_id = 5
                i.save()

            print('States of winter instructions + tours updated')

        elif season.lower() == 'summer':
            for t in Tour.objects.filter(tour__reference__category__summer=True).filter(state_id=9):
                t.state_id = 5
                t.save()

            for i in Instruction.objects.filter(instruction__reference__category__summer=True).filter(state_id=9):
                i.state_id = 5
                i.save()

            print('States of summer instructions + tours updated')

        else:
            print('use: python3.6 manage.py enable_booking <season>, e.g. winter or summer')

    def add_arguments(self, parser):
        parser.add_argument('season', type=str)

    def handle(self, *args, **options):
        season = options['season']
        self.update(season)