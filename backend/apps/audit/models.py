from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    entity_name = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=64)
    action = models.CharField(max_length=64)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditEntry(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_entries",
    )
    entity_type = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=64)
    action = models.CharField(max_length=64)
    field_name = models.CharField(max_length=255, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp", "-id"]
