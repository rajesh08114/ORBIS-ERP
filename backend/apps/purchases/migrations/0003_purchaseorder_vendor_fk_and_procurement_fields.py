import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("partners", "0001_initial"),
        ("sales", "0003_salesorder_customer_fk"),
        ("purchases", "0002_alter_purchaseorder_options_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="purchaseorder",
            name="vendor_name",
        ),
        migrations.AddField(
            model_name="purchaseorder",
            name="created_by_system",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="purchaseorder",
            name="source_sales_order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="generated_purchase_orders",
                to="sales.salesorder",
            ),
        ),
        migrations.AddField(
            model_name="purchaseorder",
            name="trigger_reason",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="purchaseorder",
            name="vendor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="purchase_orders",
                to="partners.vendor",
            ),
        ),
    ]
