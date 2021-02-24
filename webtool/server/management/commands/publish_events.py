from django.core.management.base import BaseCommand

from server.models import Tour, Instruction


class Command(BaseCommand):
    help = "Publish (state_id=5) all tours & instruction with state_id=4 (ready & checked)"

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args, **kwargs)
        self.log = None

    @staticmethod
    def publish():
        for t in Tour.objects.filter(state_id=4):
            t.state_id = 5
            t.save()

        for i in Instruction.objects.filter(state_id=4):
            i.state_id = 5
            i.save()

        print('Events published')

    def handle(self, *args, **options):
        self.publish()
