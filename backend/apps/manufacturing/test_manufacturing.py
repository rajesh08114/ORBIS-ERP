import pytest
from django.core.exceptions import ValidationError

from apps.inventory.services import receive_stock
from apps.manufacturing.models import BillOfMaterial, BillOfMaterialLine, ManufacturingOrder, WorkOrder
from apps.manufacturing.services import complete_manufacturing_order, confirm_manufacturing_order, create_manufacturing_order
from apps.products.models import Product


pytestmark = pytest.mark.django_db


def test_manufacturing_order_consumes_components_and_receives_finished_goods():
    table = Product.objects.create(name="Table", sales_price=200, cost_price=120)
    leg = Product.objects.create(name="Leg", sales_price=20, cost_price=8)
    top = Product.objects.create(name="Top", sales_price=50, cost_price=22)

    receive_stock(product=leg, quantity=12, reference="RM-1")
    receive_stock(product=top, quantity=3, reference="RM-2")

    bom = BillOfMaterial.objects.create(code="BOM-TABLE", finished_product=table)
    BillOfMaterialLine.objects.create(bom=bom, component=leg, quantity_required=4)
    BillOfMaterialLine.objects.create(bom=bom, component=top, quantity_required=1)

    order = create_manufacturing_order(reference="MO-100", bom=bom, quantity=2)
    confirm_manufacturing_order(order)
    complete_manufacturing_order(order)

    table.refresh_from_db()
    leg.refresh_from_db()
    top.refresh_from_db()
    order.refresh_from_db()

    assert order.status == ManufacturingOrder.STATUS_DONE
    assert table.on_hand_quantity == 2
    assert leg.on_hand_quantity == 4
    assert leg.reserved_quantity == 0
    assert top.on_hand_quantity == 1
    assert top.reserved_quantity == 0
    assert order.work_orders.count() == 2
    assert order.work_orders.filter(status=WorkOrder.STATUS_DONE).count() == 2


def test_manufacturing_confirm_blocks_on_missing_components():
    table = Product.objects.create(name="Desk", sales_price=300, cost_price=180)
    component = Product.objects.create(name="Bracket", sales_price=5, cost_price=2)

    bom = BillOfMaterial.objects.create(code="BOM-DESK", finished_product=table)
    BillOfMaterialLine.objects.create(bom=bom, component=component, quantity_required=10)

    order = create_manufacturing_order(reference="MO-200", bom=bom, quantity=1)

    with pytest.raises(ValidationError):
        confirm_manufacturing_order(order)
