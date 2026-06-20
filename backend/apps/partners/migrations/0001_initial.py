from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("address", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("customer_code", models.CharField(max_length=64, unique=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Vendor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("address", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("vendor_code", models.CharField(max_length=64, unique=True)),
            ],
            options={"ordering": ["name"]},
        ),
    ]
