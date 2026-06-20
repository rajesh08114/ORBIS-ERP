from typing import Any

from apps.audit.models import AuditEntry, AuditLog
from apps.common.context import get_current_actor, get_current_ip_address


def log_audit_event(
    *,
    entity_name: str,
    entity_id: str,
    action: str,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog.objects.create(
        entity_name=entity_name,
        entity_id=entity_id,
        action=action,
        details=details or {},
    )
    AuditEntry.objects.create(
        actor=get_current_actor(),
        entity_type=entity_name,
        entity_id=entity_id,
        action=action,
        field_name="",
        old_value=None,
        new_value=details or {},
        ip_address=get_current_ip_address(),
    )
    return log


def log_field_change(
    *,
    entity_type: str,
    entity_id: str,
    action: str,
    field_name: str,
    old_value: Any,
    new_value: Any,
) -> AuditEntry:
    return AuditEntry.objects.create(
        actor=get_current_actor(),
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        ip_address=get_current_ip_address(),
    )


def audit_update(instance, serializer, entity_type: str) -> Any:
    """
    Helper to perform serializer save on an update, logging any field level updates.
    """
    old_values = {}
    for field in serializer.validated_data:
        if hasattr(instance, field):
            old_values[field] = getattr(instance, field)
            
    updated_instance = serializer.save()
    
    for field, old_val in old_values.items():
        new_val = getattr(updated_instance, field)
        if old_val != new_val:
            log_field_change(
                entity_type=entity_type,
                entity_id=str(updated_instance.pk),
                action="updated",
                field_name=field,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(new_val) if new_val is not None else None,
            )
    return updated_instance
