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
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditEntry
        fields = [
            "id",
            "actor",
            "actor_name",
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

    def get_actor_name(self, obj):
        if obj.actor:
            if obj.actor.first_name or obj.actor.last_name:
                return f"{obj.actor.first_name} {obj.actor.last_name}".strip()
            return obj.actor.username
        return "System"


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["entity_name", "entity_id", "action"]
    ordering_fields = ["created_at", "entity_name", "action"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [AUDIT_VIEW], "retrieve": [AUDIT_VIEW]}


class AuditEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditEntrySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["entity_type", "entity_id", "action", "field_name"]
    ordering_fields = ["timestamp", "entity_type", "action"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [AUDIT_VIEW], "retrieve": [AUDIT_VIEW]}

    def get_queryset(self):
        queryset = AuditEntry.objects.select_related("actor").all()
        
        actor_id = self.request.query_params.get("actor")
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
            
        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
            
        action_param = self.request.query_params.get("action")
        if action_param:
            queryset = queryset.filter(action__iexact=action_param)
            
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
            
        return queryset


