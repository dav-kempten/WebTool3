from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Instruction.category: OneToOneField -> ForeignKey, so that several courses
    can share the same extra category.

    A plain AlterField would look up the UNIQUE constraint created by 0030 and
    fail on production, where that constraint has long been dropped by hand.
    Hence the schema side only drops it if it is still there (fresh databases);
    on production this migration changes nothing.
    """

    dependencies = [
        ('server', '0050_auto_20250212_2157'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    'ALTER TABLE "server_instruction" '
                    'DROP CONSTRAINT IF EXISTS "server_instruction_category_id_key";',
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='instruction',
                    name='category',
                    field=models.ForeignKey(
                        blank=True, null=True, db_index=False,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='+', to='server.category',
                        verbose_name='Zusatzkategorie',
                    ),
                ),
            ],
        ),
    ]
