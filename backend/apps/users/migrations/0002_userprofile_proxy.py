from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0003_userprofile_avatar_public_id_userprofile_status"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="UserProfile",
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[],
            options={
                "proxy": True,
                "verbose_name": "user profile",
                "verbose_name_plural": "user profiles",
                "indexes": [],
                "constraints": [],
            },
            bases=("common.userprofile",),
            managers=[
                ("objects", models.Manager()),
            ],
        ),
    ]
