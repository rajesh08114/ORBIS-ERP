import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("sales", "0003_salesorder_customer_fk"),
        ("manufacturing", "0002_alter_manufacturingorder_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Operation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("duration_minutes", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="WorkCenter",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="billofmaterialline",
            name="operation",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="bom_lines",
                to="manufacturing.operation",
            ),
        ),
        migrations.AddField(
            model_name="billofmaterialline",
            name="sequence",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="manufacturingorder",
            name="assignee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="manufacturing_orders",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="manufacturingorder",
            name="created_by_system",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="manufacturingorder",
            name="source_sales_order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="generated_manufacturing_orders",
                to="sales.salesorder",
            ),
        ),
        migrations.AddField(
            model_name="manufacturingorder",
            name="trigger_reason",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.CreateModel(
            name="WorkOrder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("ready", "Ready"),
                            ("in_progress", "In Progress"),
                            ("done", "Done"),
                        ],
                        default="draft",
                        max_length=16,
                    ),
                ),
                ("sequence", models.PositiveIntegerField(default=1)),
                ("notes", models.TextField(blank=True)),
                (
                    "assignee",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="work_orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "manufacturing_order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="work_orders",
                        to="manufacturing.manufacturingorder",
                    ),
                ),
                (
                    "operation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="work_orders",
                        to="manufacturing.operation",
                    ),
                ),
                (
                    "work_center",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="work_orders",
                        to="manufacturing.workcenter",
                    ),
                ),
            ],
            options={"ordering": ["sequence", "id"]},
        ),
        migrations.AddConstraint(
            model_name="manufacturingorder",
            constraint=models.CheckConstraint(check=models.Q(quantity__gte=0), name="manufacturing_order_qty_gte_0"),
        ),
        migrations.AddConstraint(
            model_name="billofmaterialline",
            constraint=models.CheckConstraint(
                check=models.Q(quantity_required__gt=0),
                name="bom_line_qty_required_gt_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="manufacturingorderline",
            constraint=models.CheckConstraint(
                check=models.Q(quantity_required__gte=0),
                name="manufacturing_line_qty_required_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="manufacturingorderline",
            constraint=models.CheckConstraint(
                check=models.Q(quantity_reserved__gte=0),
                name="manufacturing_line_qty_reserved_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="manufacturingorderline",
            constraint=models.CheckConstraint(
                check=models.Q(quantity_consumed__gte=0),
                name="manufacturing_line_qty_consumed_gte_0",
            ),
        ),
    ]
