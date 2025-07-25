# Generated by Django 2.2.24 on 2024-02-26 19:56

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0044_auto_20230808_2059'),
    ]

    operations = [
        migrations.AlterField(
            model_name='guide',
            name='certificate_date',
            field=models.DateField(blank=True, default=datetime.date.today, help_text='Das Datum des Ablaufs des Führungszeugnis, eingetragen durch einen MA der GS', verbose_name='Datum des Ablaufs des Führungszeugnis'),
        ),
        migrations.AlterField(
            model_name='profile',
            name='member_year',
            field=models.PositiveIntegerField(blank=True, default=2024, help_text='Jahr der Aufnahme in den AV', null=True, verbose_name='Jahr'),
        ),
    ]
