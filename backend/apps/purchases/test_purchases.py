import pytest
from django.core.exceptions import ValidationError

from apps.partners.models import Vendor
from apps.products.models import Product
from apps.purchases.models import PurchaseOrder, PurchaseOrderLine
from apps.purchases.services import confirm_purchase_order, receive_purchase_order


pytestmark = pytest.mark.django_db


def test_receive_purchase_order_increases_stock():
    vendor = Vendor.objects.create(vendor_code="VEND-100", name="Timber Supply")
    product = Product.objects.create(name="Wooden Leg", sales_price=10, cost_price=5)
    order = PurchaseOrder.objects.create(reference="PO-100", vendor=vendor)
    PurchaseOrderLine.objects.create(order=order, product=product, quantity_ordered=12, unit_cost=5)

    confirm_purchase_order(order)
    receive_purchase_order(order, quantities_by_line={order.lines.get().pk: 7})

    product.refresh_from_db()
    order.refresh_from_db()
    line = order.lines.get()

    assert product.on_hand_quantity == 7
    assert order.status == PurchaseOrder.STATUS_PARTIAL
    assert line.quantity_received == 7

    receive_purchase_order(order)
    product.refresh_from_db()
    order.refresh_from_db()
    line.refresh_from_db()

    assert product.on_hand_quantity == 12
    assert order.status == PurchaseOrder.STATUS_DONE
    assert line.quantity_received == 12


def test_confirm_purchase_order_requires_lines():
    vendor = Vendor.objects.create(vendor_code="VEND-101", name="No Lines Vendor")
    order = PurchaseOrder.objects.create(reference="PO-101", vendor=vendor)

    with pytest.raises(ValidationError):
        confirm_purchase_order(order)
