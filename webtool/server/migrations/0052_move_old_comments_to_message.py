import datetime

from django.db import migrations

# From now on the comment ("Bemerkungen") is published on the homepage as
# "Hinweis". Until then it was used for internal notes, so the comments of all
# tours and courses starting before this date are moved into the internal
# message ("Nachricht an die Geschäftsstelle") and cleared.
CUTOFF = datetime.date(2026, 10, 1)
PREFIX = 'Bisherige Bemerkung:\n'


def move_comments(apps, schema_editor):
    for model_name, event_field in (('Tour', 'tour'), ('Instruction', 'instruction')):
        model = apps.get_model('server', model_name)
        rows = (
            model.objects
            .filter(**{f'{event_field}__start_date__lt': CUTOFF})
            .exclude(comment__regex=r'^\s*$')
            .values_list('pk', 'comment', 'message')
        )
        for pk, comment, message in rows:
            moved = PREFIX + comment.strip()
            message = f'{message.rstrip()}\n\n{moved}' if message.strip() else moved
            # update() instead of save(): leaves the `updated` timestamp alone.
            model.objects.filter(pk=pk).update(message=message, comment='')


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0051_instruction_category_foreignkey'),
    ]

    operations = [
        migrations.RunPython(move_comments, migrations.RunPython.noop),
    ]
