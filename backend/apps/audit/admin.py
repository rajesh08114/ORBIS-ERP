from django.contrib import admin

from apps.audit.models import AuditEntry, AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "entity_name", "entity_id", "action")
    list_filter = ("entity_name", "action", "created_at")
    search_fields = ("entity_name", "entity_id", "action")
    readonly_fields = ("created_at",)


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "actor", "entity_type", "entity_id", "action", "field_name", "ip_address")
    list_filter = ("entity_type", "action", "timestamp")
    search_fields = ("entity_type", "entity_id", "action", "field_name")
    readonly_fields = ("timestamp",)
