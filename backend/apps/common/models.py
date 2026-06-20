from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DashboardAccess(Group):
    class Meta:
        proxy = True
        permissions = [("view_dashboard", "Can view dashboard")]


class UserProfile(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_INACTIVE = "inactive"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_INACTIVE, "Inactive"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="erp_profile",
    )
    role_title = models.CharField(max_length=64, blank=True, default="")
    mobile = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    position = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True)
    avatar_public_id = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
    )

    class Meta:
        ordering = ["user__username"]

    def __str__(self):
        return f"Profile<{self.user_id}>"
