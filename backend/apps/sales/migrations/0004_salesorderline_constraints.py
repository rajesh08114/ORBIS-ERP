from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sales", "0003_salesorder_customer_fk"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="salesorderline",
            constraint=models.CheckConstraint(check=models.Q(quantity_ordered__gt=0), name="sales_line_qty_ordered_gt_0"),
        ),
        migrations.AddConstraint(
            model_name="salesorderline",
            constraint=models.CheckConstraint(check=models.Q(quantity_reserved__gte=0), name="sales_line_qty_reserved_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="salesorderline",
            constraint=models.CheckConstraint(check=models.Q(quantity_delivered__gte=0), name="sales_line_qty_delivered_gte_0"),
        ),
    ]
