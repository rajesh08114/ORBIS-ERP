from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.audit.services import log_audit_event, log_field_change
from apps.inventory.services import deliver_stock, release_stock, reserve_stock, deliver_reserved_stock
from apps.manufacturing.services import active_bom_for_product, confirm_manufacturing_order, create_manufacturing_order
from apps.products.models import Product
from apps.sales.models import SalesOrder, SalesOrderLine


def _as_decimal(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


def _auto_reference(prefix: str, order: SalesOrder, line_id: int) -> str:
    return f"{prefix}-{order.reference}-{line_id}"


def _trigger_procurement(order: SalesOrder, line: SalesOrderLine, shortage: Decimal) -> dict:
    product = line.product
    trigger_reason = f"Sales shortage for {order.reference}"
    log_audit_event(
        entity_name="SalesOrder",
        entity_id=str(order.pk),
        action="procurement_triggered",
        details={
            "reference": order.reference,
            "product_id": product.pk,
            "shortage": str(shortage),
            "procurement_type": product.procurement_type,
        },
    )

    if product.procurement_type == Product.PROCUREMENT_PURCHASE:
        from apps.purchases.models import PurchaseOrder, PurchaseOrderLine
        from apps.purchases.services import confirm_purchase_order

        if not product.vendor:
            raise ValidationError(f"Product {product.name} requires a vendor to trigger purchase procurement.")

        purchase_order = PurchaseOrder.objects.create(
            reference=_auto_reference("AUTO-PO", order, line.pk),
            vendor=product.vendor,
            source_sales_order=order,
            trigger_reason=trigger_reason,
            created_by_system=True,
        )
        PurchaseOrderLine.objects.create(
            order=purchase_order,
            product=product,
            quantity_ordered=shortage,
            unit_cost=product.cost_price,
        )
        confirm_purchase_order(purchase_order)
        return {"type": "PurchaseOrder", "reference": purchase_order.reference, "product": product.name, "quantity": str(shortage)}

    if product.procurement_type == Product.PROCUREMENT_MANUFACTURE:
        bom = product.default_bom or active_bom_for_product(product)
        if not bom:
            raise ValidationError(f"No active BoM found for manufactured product {product.name}.")
        manufacturing_order = create_manufacturing_order(
            reference=_auto_reference("AUTO-MO", order, line.pk),
            bom=bom,
            quantity=shortage,
            notes=trigger_reason,
            source_sales_order=order,
            trigger_reason=trigger_reason,
            created_by_system=True,
        )
        confirm_manufacturing_order(manufacturing_order)
        return {"type": "ManufacturingOrder", "reference": manufacturing_order.reference, "product": product.name, "quantity": str(shortage)}

    raise ValidationError(f"Unsupported procurement type for {product.name}.")


@transaction.atomic
def confirm_sales_order(order: SalesOrder) -> tuple[SalesOrder, list]:
    procurements = []
    order = (
        SalesOrder.objects.select_for_update()
        .prefetch_related("lines__product")
        .get(pk=order.pk)
    )

    if order.status != SalesOrder.STATUS_DRAFT:
        raise ValidationError("Only draft sales orders can be confirmed.")

    if not order.lines.exists():
        raise ValidationError("A sales order must contain at least one line.")

    for line in order.lines.select_related("product"):
        if line.quantity_ordered <= 0:
            raise ValidationError("Ordered quantity must be greater than zero.")

        from apps.products.models import Product
        locked_product = Product.objects.select_for_update().get(pk=line.product_id)
        product = locked_product
        required = _as_decimal(line.quantity_ordered - line.quantity_reserved)
        available = _as_decimal(locked_product.free_to_use_quantity)

        if product.procurement_strategy == Product.PROCUREMENT_MTO:
            proc = _trigger_procurement(order, line, required)
            procurements.append(proc)
        else:
            if available >= required:
                reserve_stock(
                    product=product,
                    quantity=required,
                    reference=order.reference,
                    notes=f"Reserved for sales order {order.reference}",
                )
                line.quantity_reserved += required
                log_field_change(
                    entity_type="SalesOrderLine",
                    entity_id=str(line.pk),
                    action="reserved",
                    field_name="quantity_reserved",
                    old_value=str(line.quantity_reserved - required),
                    new_value=str(line.quantity_reserved),
                )
            else:
                shortage = required - available
                if available > 0:
                    reserve_stock(
                        product=product,
                        quantity=available,
                        reference=order.reference,
                        notes=f"Reserved available stock for sales order {order.reference}",
                    )
                    line.quantity_reserved += available
                    log_field_change(
                        entity_type="SalesOrderLine",
                        entity_id=str(line.pk),
                        action="reserved",
                        field_name="quantity_reserved",
                        old_value=str(line.quantity_reserved - available),
                        new_value=str(line.quantity_reserved),
                    )
                if not product.procure_on_demand:
                    raise ValidationError(
                        f"Not enough free stock for {product.name}. "
                        f"Required {required}, available {available}."
                    )
                proc = _trigger_procurement(order, line, shortage)
                procurements.append(proc)
        line.save(update_fields=["quantity_reserved"])

    order.status = SalesOrder.STATUS_CONFIRMED
    order.confirmed_at = timezone.now()
    order.save(update_fields=["status", "confirmed_at"])
    log_field_change(
        entity_type="SalesOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=SalesOrder.STATUS_DRAFT,
        new_value=SalesOrder.STATUS_CONFIRMED,
    )
    log_audit_event(
        entity_name="SalesOrder",
        entity_id=str(order.pk),
        action="confirmed",
        details={"reference": order.reference, "customer": order.customer_name},
    )
    return order, procurements


@transaction.atomic
def deliver_sales_order(
    order: SalesOrder,
    *,
    quantities_by_line: dict[int, Decimal | int | str] | None = None,
) -> SalesOrder:
    order = (
        SalesOrder.objects.select_for_update()
        .prefetch_related("lines__product")
        .get(pk=order.pk)
    )

    if order.status not in {SalesOrder.STATUS_CONFIRMED, SalesOrder.STATUS_PARTIAL}:
        raise ValidationError("Only confirmed sales orders can be delivered.")

    quantities_by_line = quantities_by_line or {}
    delivered_any = False

    for line in order.lines.select_related("product"):
        requested = quantities_by_line.get(line.pk, line.quantity_remaining)
        requested = _as_decimal(requested)

        if requested <= 0:
            continue

        if requested > line.quantity_reserved:
            raise ValidationError(
                f"Cannot deliver {requested} units for {line.product.name}; "
                f"only {line.quantity_reserved} reserved."
            )

        deliver_reserved_stock(
            product=line.product,
            quantity=requested,
            reference=order.reference,
            notes=f"Delivered for sales order {order.reference}",
        )

        line.quantity_delivered += requested
        line.quantity_reserved -= requested
        line.save(update_fields=["quantity_delivered", "quantity_reserved"])
        log_field_change(
            entity_type="SalesOrderLine",
            entity_id=str(line.pk),
            action="delivered",
            field_name="quantity_delivered",
            old_value=str(line.quantity_delivered - requested),
            new_value=str(line.quantity_delivered),
        )
        delivered_any = True

    if delivered_any:
        previous_status = order.status
        remaining = SalesOrderLine.objects.filter(
            order_id=order.pk,
            quantity_delivered__lt=F("quantity_ordered"),
        ).exists()
        order.status = SalesOrder.STATUS_PARTIAL if remaining else SalesOrder.STATUS_DONE
        if order.status == SalesOrder.STATUS_DONE:
            order.delivered_at = timezone.now()
            order.save(update_fields=["status", "delivered_at"])
        else:
            order.save(update_fields=["status"])
        log_field_change(
            entity_type="SalesOrder",
            entity_id=str(order.pk),
            action="status_changed",
            field_name="status",
            old_value=previous_status,
            new_value=order.status,
        )

    return order


@transaction.atomic
def cancel_sales_order(order: SalesOrder) -> SalesOrder:
    order = SalesOrder.objects.select_for_update().prefetch_related("lines__product").get(pk=order.pk)

    if order.status == SalesOrder.STATUS_DONE:
        raise ValidationError("Delivered sales orders cannot be cancelled.")

    for line in order.lines.select_related("product"):
        if line.quantity_reserved > 0:
            release_stock(
                product=line.product,
                quantity=line.quantity_reserved,
                reference=order.reference,
                notes=f"Cancelled sales order {order.reference}",
            )
            line.quantity_reserved = Decimal("0")
            line.save(update_fields=["quantity_reserved"])

    previous_status = order.status
    order.status = SalesOrder.STATUS_CANCELLED
    order.save(update_fields=["status"])
    log_field_change(
        entity_type="SalesOrder",
        entity_id=str(order.pk),
        action="status_changed",
        field_name="status",
        old_value=previous_status,
        new_value=SalesOrder.STATUS_CANCELLED,
    )
    return order
