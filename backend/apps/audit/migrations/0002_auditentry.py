import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("audit", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity_type", models.CharField(max_length=255)),
                ("entity_id", models.CharField(max_length=64)),
                ("action", models.CharField(max_length=64)),
                ("field_name", models.CharField(blank=True, max_length=255)),
                ("old_value", models.JSONField(blank=True, null=True)),
                ("new_value", models.JSONField(blank=True, null=True)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="audit_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-timestamp", "-id"]},
        ),
    ]
