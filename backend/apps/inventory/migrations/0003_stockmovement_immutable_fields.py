import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("inventory", "0002_alter_stockmovement_options_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="stockmovement",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="stock_movements",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="stockmovement",
            name="quantity",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="stockmovement",
            name="reference_id",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name="stockmovement",
            name="reference_type",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["reference_type", "reference_id"], name="inv_stock_referenc_3b6e5d_idx"),
        ),
        migrations.AddIndex(
            model_name="stockmovement",
            index=models.Index(fields=["product", "created_at"], name="inv_stock_product_6d7bbf_idx"),
        ),
        migrations.AddConstraint(
            model_name="stockmovement",
            constraint=models.CheckConstraint(check=models.Q(quantity__gte=0), name="stock_movement_qty_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="stockmovement",
            constraint=models.CheckConstraint(check=models.Q(on_hand_after__gte=0), name="stock_movement_on_hand_after_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="stockmovement",
            constraint=models.CheckConstraint(check=models.Q(reserved_after__gte=0), name="stock_movement_reserved_after_gte_0"),
        ),
    ]
