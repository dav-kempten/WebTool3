# -*- coding: utf-8 -*-
# Kennzeichen für Übernachtungstouren, aufgebaut wie 'lea'.
#
# Von Hand auf das neue Feld beschränkt: makemigrations wollte zusätzlich den
# bekannten AlterField-Drift über den gesamten Bestand mitnehmen (siehe 0054).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0054_requirement'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='overnight',
            field=models.BooleanField(blank=True, db_index=True, default=False, verbose_name='Übernachtungstour'),
        ),
    ]
