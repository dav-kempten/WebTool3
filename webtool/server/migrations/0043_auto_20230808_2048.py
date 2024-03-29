# Generated by Django 2.2.24 on 2023-08-08 18:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0042_auto_20230808_2044'),
    ]

    operations = [
        migrations.AlterField(
            model_name='instruction',
            name='kv_link',
            field=models.URLField(blank=True, default='https://www.dav-kempten.de/', help_text='Link zum KV', verbose_name='KV-Link'),
        ),
        migrations.AlterField(
            model_name='tour',
            name='kv_link',
            field=models.URLField(blank=True, default='https://www.dav-kempten.de/', help_text='Link zum KV', verbose_name='KV-Link'),
        ),
    ]
