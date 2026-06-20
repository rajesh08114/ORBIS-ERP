from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.audit.services import log_audit_event, log_field_change
from apps.inventory.services import receive_stock
from apps.purchases.models import PurchaseOrder, PurchaseOrderLine


def _as_decimal(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


@transaction.atomic
def confirm_purchase_order(order: PurchaseOrder) -> PurchaseOrder:
    order = PurchaseOrder.objects.select_for_update().prefetch_related("lines__product").get(pk=order.pk)

    if order.status != PurchaseOrder.STATUS_DRAFT:
        raise ValidationError("Only draft purchase orders can be confirmed.")

    if not order.lines.exists():
        raise ValidationError("A purchase order must contain at least one line.")

    for line in order.lines.select_related("product"):
        if line.quantity_ordered <= 0:
            raise ValidationError("Ordered quantity must be greater than zero.")

    order.status = PurchaseOrder.STATUS_CONFIRMED
    order.confirmed_at = timezone.now()
    order.save(update_fields=["status", "confirmed_at"])
    log_field_change(
        entity_type="PurchaseOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=PurchaseOrder.STATUS_DRAFT,
        new_value=PurchaseOrder.STATUS_CONFIRMED,
    )
    log_audit_event(
        entity_name="PurchaseOrder",
        entity_id=str(order.pk),
        action="confirmed",
        details={"reference": order.reference, "vendor_name": order.vendor_name},
    )
    return order


@transaction.atomic
def receive_purchase_order(
    order: PurchaseOrder,
    *,
    quantities_by_line: dict[int, Decimal | int | str] | None = None,
) -> PurchaseOrder:
    order = PurchaseOrder.objects.select_for_update().prefetch_related("lines__product").get(pk=order.pk)

    if order.status not in {PurchaseOrder.STATUS_CONFIRMED, PurchaseOrder.STATUS_PARTIAL}:
        raise ValidationError("Only confirmed purchase orders can be received.")

    quantities_by_line = quantities_by_line or {}
    received_any = False

    for line in order.lines.select_related("product"):
        requested = quantities_by_line.get(line.pk, line.quantity_remaining)
        requested = _as_decimal(requested)

        if requested <= 0:
            continue

        if requested > line.quantity_remaining:
            raise ValidationError(
                f"Cannot receive {requested} units for {line.product.name}; "
                f"only {line.quantity_remaining} pending."
            )

        receive_stock(
            product=line.product,
            quantity=requested,
            reference=order.reference,
            notes=f"Received against purchase order {order.reference}",
        )
        line.quantity_received += requested
        line.save(update_fields=["quantity_received"])
        log_field_change(
            entity_type="PurchaseOrderLine",
            entity_id=str(line.pk),
            action="received",
            field_name="quantity_received",
            old_value=str(line.quantity_received - requested),
            new_value=str(line.quantity_received),
        )
        received_any = True

    if received_any:
        remaining = PurchaseOrderLine.objects.filter(
            order_id=order.pk,
            quantity_received__lt=F("quantity_ordered"),
        ).exists()
        order.status = PurchaseOrder.STATUS_PARTIAL if remaining else PurchaseOrder.STATUS_DONE
        if order.status == PurchaseOrder.STATUS_DONE:
            order.received_at = timezone.now()
            order.save(update_fields=["status", "received_at"])
        else:
            order.save(update_fields=["status"])
        log_field_change(
            entity_type="PurchaseOrder",
            entity_id=str(order.pk),
            action="status_changed",
            field_name="status",
            old_value=PurchaseOrder.STATUS_CONFIRMED,
            new_value=order.status,
        )

        log_audit_event(
            entity_name="PurchaseOrder",
            entity_id=str(order.pk),
            action="received",
            details={"reference": order.reference, "status": order.status},
        )

    return order

@transaction.atomic
def cancel_purchase_order(order: PurchaseOrder) -> PurchaseOrder:
    order = PurchaseOrder.objects.select_for_update().prefetch_related("lines__product").get(pk=order.pk)

    if order.status == PurchaseOrder.STATUS_DONE:
        raise ValidationError("Received purchase orders cannot be cancelled.")

    previous_status = order.status
    order.status = PurchaseOrder.STATUS_CANCELLED
    order.save(update_fields=["status"])
    log_field_change(
        entity_type="PurchaseOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=previous_status,
        new_value=PurchaseOrder.STATUS_CANCELLED,
    )
    return order
