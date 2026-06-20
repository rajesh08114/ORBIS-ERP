from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.audit.services import log_audit_event, log_field_change
from apps.inventory.services import deliver_stock, receive_stock, reserve_stock, release_stock, deliver_reserved_stock
from apps.manufacturing.models import (
    BillOfMaterial,
    ManufacturingOrder,
    ManufacturingOrderLine,
    WorkCenter,
    WorkOrder,
)


def _as_decimal(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


@transaction.atomic
def create_manufacturing_order(
    *,
    reference: str,
    bom: BillOfMaterial,
    quantity,
    notes: str = "",
    source_sales_order=None,
    trigger_reason: str = "",
    created_by_system: bool = False,
) -> ManufacturingOrder:
    quantity = _as_decimal(quantity)
    if quantity <= 0:
        raise ValidationError("Manufacturing quantity must be greater than zero.")

    bom = BillOfMaterial.objects.select_for_update().get(pk=bom.pk, is_active=True)
    order = ManufacturingOrder.objects.create(
        reference=reference,
        bom=bom,
        finished_product=bom.finished_product,
        quantity=quantity,
        notes=notes,
        source_sales_order=source_sales_order,
        trigger_reason=trigger_reason,
        created_by_system=created_by_system,
    )

    component_lines = []
    for bom_line in bom.lines.select_related("component"):
        component_lines.append(
            ManufacturingOrderLine(
                order=order,
                component=bom_line.component,
                quantity_required=bom_line.quantity_required * quantity,
            )
        )

    ManufacturingOrderLine.objects.bulk_create(component_lines)
    log_audit_event(
        entity_name="ManufacturingOrder",
        entity_id=str(order.pk),
        action="created",
        details={"reference": order.reference, "quantity": str(quantity)},
    )
    return order


def _generate_work_orders(order: ManufacturingOrder) -> None:
    if order.work_orders.exists():
        return

    work_orders = []
    for line in order.bom.lines.select_related("operation").order_by("sequence", "id"):
        work_orders.append(
            WorkOrder(
                manufacturing_order=order,
                operation=line.operation,
                work_center=WorkCenter.objects.order_by("code").first(),
                assignee=order.assignee,
                sequence=line.sequence,
                status=WorkOrder.STATUS_READY,
            )
        )
    if work_orders:
        WorkOrder.objects.bulk_create(work_orders)


@transaction.atomic
def confirm_manufacturing_order(order: ManufacturingOrder) -> ManufacturingOrder:
    order = ManufacturingOrder.objects.select_for_update().prefetch_related("component_lines__component").get(pk=order.pk)

    if order.status != ManufacturingOrder.STATUS_DRAFT:
        raise ValidationError("Only draft manufacturing orders can be confirmed.")

    for line in order.component_lines.select_related("component"):
        if line.quantity_required <= 0:
            raise ValidationError("Component requirement must be greater than zero.")
        if line.component.free_to_use_quantity < line.quantity_required:
            raise ValidationError(
                f"Not enough stock for component {line.component.name}. "
                f"Required {line.quantity_required}, available {line.component.free_to_use_quantity}."
            )
        reserve_stock(
            product=line.component,
            quantity=line.quantity_required,
            reference=order.reference,
            notes=f"Reserved for manufacturing order {order.reference}",
        )
        line.quantity_reserved = line.quantity_required
        line.save(update_fields=["quantity_reserved"])

    order.status = ManufacturingOrder.STATUS_CONFIRMED
    order.confirmed_at = timezone.now()
    order.save(update_fields=["status", "confirmed_at"])
    _generate_work_orders(order)
    log_field_change(
        entity_type="ManufacturingOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=ManufacturingOrder.STATUS_DRAFT,
        new_value=ManufacturingOrder.STATUS_CONFIRMED,
    )
    log_audit_event(
        entity_name="ManufacturingOrder",
        entity_id=str(order.pk),
        action="confirmed",
        details={"reference": order.reference},
    )
    return order


@transaction.atomic
def start_manufacturing_order(order: ManufacturingOrder) -> ManufacturingOrder:
    order = ManufacturingOrder.objects.select_for_update().get(pk=order.pk)
    if order.status != ManufacturingOrder.STATUS_CONFIRMED:
        raise ValidationError("Only confirmed manufacturing orders can be started.")

    _generate_work_orders(order)
    order.status = ManufacturingOrder.STATUS_IN_PROGRESS
    order.save(update_fields=["status"])
    log_field_change(
        entity_type="ManufacturingOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=ManufacturingOrder.STATUS_CONFIRMED,
        new_value=ManufacturingOrder.STATUS_IN_PROGRESS,
    )
    return order


@transaction.atomic
def complete_work_order(work_order: WorkOrder) -> WorkOrder:
    work_order = WorkOrder.objects.select_for_update().get(pk=work_order.pk)
    if work_order.status not in {WorkOrder.STATUS_READY, WorkOrder.STATUS_IN_PROGRESS}:
        raise ValidationError("Only ready work orders can be completed.")
    previous_status = work_order.status
    work_order.status = WorkOrder.STATUS_DONE
    work_order.save(update_fields=["status"])
    log_field_change(
        entity_type="WorkOrder",
        entity_id=str(work_order.pk),
        action="status_changed",
        field_name="status",
        old_value=previous_status,
        new_value=WorkOrder.STATUS_DONE,
    )
    return work_order


@transaction.atomic
def complete_manufacturing_order(order: ManufacturingOrder) -> ManufacturingOrder:
    order = ManufacturingOrder.objects.select_for_update().prefetch_related("component_lines__component").get(pk=order.pk)

    if order.status not in {ManufacturingOrder.STATUS_CONFIRMED, ManufacturingOrder.STATUS_IN_PROGRESS}:
        raise ValidationError("Only confirmed manufacturing orders can be completed.")

    previous_status = order.status
    _generate_work_orders(order)
    for work_order in order.work_orders.select_related("operation", "work_center"):
        if work_order.status != WorkOrder.STATUS_DONE:
            complete_work_order(work_order)

    for line in order.component_lines.select_related("component"):
        if line.quantity_reserved <= 0:
            raise ValidationError(f"No reserved quantity found for component {line.component.name}.")

        deliver_reserved_stock(
            product=line.component,
            quantity=line.quantity_reserved,
            reference=order.reference,
            notes=f"Consumed in manufacturing order {order.reference}",
        )
        line.quantity_consumed = line.quantity_reserved
        line.quantity_reserved = Decimal("0")
        line.save(update_fields=["quantity_consumed", "quantity_reserved"])

    receive_stock(
        product=order.finished_product,
        quantity=order.quantity,
        reference=order.reference,
        notes=f"Manufactured via order {order.reference}",
    )
    order.status = ManufacturingOrder.STATUS_DONE
    order.completed_at = timezone.now()
    order.save(update_fields=["status", "completed_at"])
    log_field_change(
        entity_type="ManufacturingOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=previous_status,
        new_value=ManufacturingOrder.STATUS_DONE,
    )
    log_audit_event(
        entity_name="ManufacturingOrder",
        entity_id=str(order.pk),
        action="completed",
        details={"reference": order.reference, "quantity": str(order.quantity)},
    )
    return order


def active_bom_for_product(product):
    return BillOfMaterial.objects.filter(finished_product=product, is_active=True).order_by("-version").first()
