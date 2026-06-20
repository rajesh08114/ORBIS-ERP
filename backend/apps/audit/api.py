from rest_framework import filters, serializers, viewsets

from apps.audit.models import AuditEntry, AuditLog
from apps.common.api import ERPActionPermission
from apps.common.permissions import AUDIT_VIEW


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "entity_name", "entity_id", "action", "details", "created_at"]
        read_only_fields = fields


class AuditEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEntry
        fields = [
            "id",
            "actor",
            "entity_type",
            "entity_id",
            "action",
            "field_name",
            "old_value",
            "new_value",
            "timestamp",
            "ip_address",
        ]
        read_only_fields = fields


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["entity_name", "entity_id", "action"]
    ordering_fields = ["created_at", "entity_name", "action"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [AUDIT_VIEW], "retrieve": [AUDIT_VIEW]}


class AuditEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditEntry.objects.select_related("actor")
    serializer_class = AuditEntrySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["entity_type", "entity_id", "action", "field_name"]
    ordering_fields = ["timestamp", "entity_type", "action"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [AUDIT_VIEW], "retrieve": [AUDIT_VIEW]}

