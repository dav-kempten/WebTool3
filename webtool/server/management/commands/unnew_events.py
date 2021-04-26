from django.core.management.base import BaseCommand

from server.models import Tour, Instruction


class Command(BaseCommand):
    help = "Reset events new-State by command"

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    @staticmethod
    def publish():
        for t in Tour.objects.filter(tour__new=True):
            t.tour.new = False
            t.tour.save()

        for i in Instruction.objects.filter(instruction__new=True):
            i.instruction.new = False
            i.instruction.save()

        print('New-Mark of Events deleted')

    def handle(self, *args, **options):
        self.publish()
