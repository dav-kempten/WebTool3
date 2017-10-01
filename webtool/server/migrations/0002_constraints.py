# -*- coding: utf-8 -*-
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0001_initial'),
    ]

    operations = [
        # migrations.RunSQL('CREATE EXTENSION IF NOT EXISTS btree_gist;'),
        migrations.RunSQL('CREATE UNIQUE INDEX ON "server_season" ("current") WHERE "current";'),
        migrations.RunSQL('ALTER TABLE "server_vacation" ADD CONSTRAINT "chronology" CHECK ("start_date" < "end_date");'),
        # migrations.RunSQL('ALTER TABLE "server_vacation" ADD CONSTRAINT "overlapping" EXCLUDE USING gist ( "calendar_id" WITH =, DATERANGE("start_date", "end_date", "[]") WITH &&)'),
        migrations.RunSQL(
            'ALTER TABLE "server_anniversary" ADD CONSTRAINT "exclusive_expression" CHECK ('
            '(NOT("fixed_date" IS NULL) AND '
            '"day_occurrence" IS NULL AND "weekday" IS NULL AND "month" IS NULL AND '
            '"easter_offset" IS NULL AND '
            '"advent_offset" IS NULL) OR '
            '("fixed_date" IS NULL AND '
            'NOT("day_occurrence" IS NULL AND "weekday" IS NULL AND "month" IS NULL) AND '
            '"easter_offset" IS NULL AND '
            '"advent_offset" IS NULL) OR '
            '("fixed_date" IS NULL AND '
            '"day_occurrence" IS NULL AND "weekday" IS NULL AND "month" IS NULL AND '
            'NOT("easter_offset" IS NULL) AND '
            '"advent_offset" IS NULL) OR '
            '("fixed_date" IS NULL AND '
            '"day_occurrence" IS NULL AND "weekday" IS NULL AND "month" IS NULL AND '
            '"easter_offset" IS NULL AND '
            'NOT("advent_offset" IS NULL)));'
        ),
    ]
