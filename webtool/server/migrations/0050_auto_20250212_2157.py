# Generated by Django 2.2.24 on 2025-02-12 20:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0049_guide_contract_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='guide',
            name='contract_required',
            field=models.BooleanField(default=False, help_text='Ist ein Trainervertrag vom Guide unterzeichnet oder nicht', verbose_name='Trainervertrag unterschrieben'),
        ),
    ]
