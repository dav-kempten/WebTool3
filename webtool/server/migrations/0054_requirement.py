# -*- coding: utf-8 -*-
# Bedarf je Kurs- und Tourenart, Grundlage der Bedarfsanzeige im Dashboard.
#
# Von Hand auf die neue Tabelle beschränkt: makemigrations wollte zusätzlich
# rund 360 Zeilen AlterField über den gesamten Bestand mitnehmen (BigAutoField
# als DEFAULT_AUTO_FIELD, db_index auf den M2M-Feldern). Dieser Drift besteht
# unabhängig von dieser Änderung und gehört in eine eigene Migration.

import django.db.models.deletion
import server.models.defaults
import server.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0053_reference_three_digit_satellites'),
    ]

    operations = [
        migrations.CreateModel(
            name='Requirement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('updated', models.DateTimeField(auto_now=True)),
                ('deprecated', models.BooleanField(blank=True, default=False, verbose_name='Element gilt als gelöscht')),
                ('kind', models.CharField(choices=[('instruction', 'Kurs'), ('tour', 'Tour')], db_index=True, default='tour', help_text='Zählt der Bedarf Kurse oder Touren?', max_length=11, verbose_name='Art')),
                ('minimum', models.PositiveSmallIntegerField(blank=True, default=0, help_text='Wie viele Veranstaltungen mindestens gebraucht werden. 0 = kein Bedarf hinterlegt', verbose_name='Bedarf')),
                ('maximum', models.PositiveSmallIntegerField(blank=True, help_text='Nur ausfüllen, wenn der Bedarf eine Spanne ist, z.B. 10-12', null=True, verbose_name='Bedarf (Obergrenze)')),
                ('order', server.models.fields.OrderField(blank=True, db_index=True, default=0, help_text='Reihenfolge in der Bedarfsanzeige', verbose_name='Reihenfolge')),
                ('category', models.ForeignKey(help_text='Bei Kursen die Kategorie des Kursinhalts, bei Touren die Tourenkategorie', on_delete=django.db.models.deletion.PROTECT, related_name='requirement_list', to='server.category', verbose_name='Kategorie')),
                ('season', models.ForeignKey(blank=True, default=server.models.defaults.get_default_season, on_delete=django.db.models.deletion.PROTECT, related_name='%(class)s_list', to='server.season', verbose_name='Saison')),
            ],
            options={
                'verbose_name': 'Bedarf',
                'verbose_name_plural': 'Bedarfe',
                'ordering': ('kind', 'order', 'category__order', 'category__name'),
                'get_latest_by': 'updated',
                'unique_together': {('season', 'kind', 'category')},
            },
        ),
    ]
