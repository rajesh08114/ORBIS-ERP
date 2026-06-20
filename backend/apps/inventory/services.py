from decimal import Decimal

from django.db import transaction

from apps.audit.services import log_audit_event, log_field_change
from apps.common.context import get_current_actor
from apps.inventory.models import StockMovement
from apps.products.models import Product


def _as_decimal(quantity) -> Decimal:
    return quantity if isinstance(quantity, Decimal) else Decimal(str(quantity))


@transaction.atomic
def record_movement(
    *,
    product: Product,
    movement_type: str,
    on_hand_delta=Decimal("0"),
    reserved_delta=Decimal("0"),
    reference: str = "",
    notes: str = "",
) -> StockMovement:
    product = Product.objects.select_for_update().get(pk=product.pk)

    on_hand_delta = _as_decimal(on_hand_delta)
    reserved_delta = _as_decimal(reserved_delta)

    on_hand_before = product.on_hand_quantity
    reserved_before = product.reserved_quantity
    on_hand_after = on_hand_before + on_hand_delta
    reserved_after = reserved_before + reserved_delta

    if on_hand_after < 0:
        raise ValueError("Stock movement cannot result in negative on-hand quantity.")

    if reserved_after < 0:
        raise ValueError("Stock movement cannot result in negative reserved quantity.")

    product.on_hand_quantity = on_hand_after
    product.reserved_quantity = reserved_after
    product.save(update_fields=["on_hand_quantity", "reserved_quantity"])
    log_field_change(
        entity_type="Product",
        entity_id=str(product.pk),
        action="quantity_changed",
        field_name="on_hand_quantity",
        old_value=str(on_hand_before),
        new_value=str(on_hand_after),
    )
    log_field_change(
        entity_type="Product",
        entity_id=str(product.pk),
        action="quantity_changed",
        field_name="reserved_quantity",
        old_value=str(reserved_before),
        new_value=str(reserved_after),
    )

    quantity = max(abs(on_hand_delta), abs(reserved_delta))
    movement = StockMovement.objects.create(
        product=product,
        reference_type=movement_type,
        reference_id=reference,
        quantity=quantity,
        movement_type=movement_type,
        reference=reference,
        on_hand_delta=on_hand_delta,
        reserved_delta=reserved_delta,
        on_hand_before=on_hand_before,
        on_hand_after=on_hand_after,
        reserved_before=reserved_before,
        reserved_after=reserved_after,
        notes=notes,
        created_by=get_current_actor(),
    )
    log_audit_event(
        entity_name="StockMovement",
        entity_id=str(movement.pk),
        action=movement_type,
        details={
            "product_id": product.pk,
            "reference": reference,
            "on_hand_delta": str(on_hand_delta),
            "reserved_delta": str(reserved_delta),
        },
    )
    return movement


def receive_stock(*, product: Product, quantity, reference: str = "", notes: str = ""):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_RECEIPT,
        on_hand_delta=_as_decimal(quantity),
        reference=reference,
        notes=notes,
    )


def deliver_stock(*, product: Product, quantity, reference: str = "", notes: str = ""):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_DELIVERY,
        on_hand_delta=-_as_decimal(quantity),
        reference=reference,
        notes=notes,
    )


def deliver_reserved_stock(*, product: Product, quantity, reference: str = "", notes: str = ""):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_DELIVERY,
        on_hand_delta=-_as_decimal(quantity),
        reserved_delta=-_as_decimal(quantity),
        reference=reference,
        notes=notes,
    )


def reserve_stock(*, product: Product, quantity, reference: str = "", notes: str = ""):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_RESERVATION,
        reserved_delta=_as_decimal(quantity),
        reference=reference,
        notes=notes,
    )


def release_stock(*, product: Product, quantity, reference: str = "", notes: str = ""):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_RELEASE,
        reserved_delta=-_as_decimal(quantity),
        reference=reference,
        notes=notes,
    )


def adjust_stock(
    *,
    product: Product,
    on_hand_delta,
    reserved_delta=Decimal("0"),
    reference: str = "",
    notes: str = "",
):
    return record_movement(
        product=product,
        movement_type=StockMovement.TYPE_ADJUSTMENT,
        on_hand_delta=on_hand_delta,
        reserved_delta=reserved_delta,
        reference=reference,
        notes=notes,
    )
