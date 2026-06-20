import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("manufacturing", "0002_alter_manufacturingorder_options_and_more"),
        ("partners", "0001_initial"),
        ("products", "0002_remove_product_stock_quantity_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="default_bom",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_products",
                to="manufacturing.billofmaterial",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="procure_on_demand",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="procurement_type",
            field=models.CharField(
                choices=[("purchase", "Purchase"), ("manufacture", "Manufacture")],
                default="purchase",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="vendor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="products",
                to="partners.vendor",
            ),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(sales_price__gte=0), name="product_sales_price_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(cost_price__gte=0), name="product_cost_price_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(on_hand_quantity__gte=0), name="product_on_hand_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(check=models.Q(reserved_quantity__gte=0), name="product_reserved_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(
                check=models.Q(reserved_quantity__lte=models.F("on_hand_quantity")),
                name="product_reserved_lte_on_hand",
            ),
        ),
    ]
