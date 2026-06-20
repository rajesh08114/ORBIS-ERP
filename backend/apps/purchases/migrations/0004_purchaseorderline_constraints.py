from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("purchases", "0003_purchaseorder_vendor_fk_and_procurement_fields"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="purchaseorderline",
            constraint=models.CheckConstraint(check=models.Q(quantity_ordered__gt=0), name="purchase_line_qty_ordered_gt_0"),
        ),
        migrations.AddConstraint(
            model_name="purchaseorderline",
            constraint=models.CheckConstraint(check=models.Q(quantity_received__gte=0), name="purchase_line_qty_received_gte_0"),
        ),
    ]
