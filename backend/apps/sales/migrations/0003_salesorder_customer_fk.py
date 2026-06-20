import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("partners", "0001_initial"),
        ("sales", "0002_alter_salesorder_options_salesorder_confirmed_at_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="salesorder",
            name="customer_name",
        ),
        migrations.AddField(
            model_name="salesorder",
            name="customer",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sales_orders",
                to="partners.customer",
            ),
        ),
    ]
