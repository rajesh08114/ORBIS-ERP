import pytest
from django.core.exceptions import ValidationError

from apps.partners.models import Customer, Vendor
from apps.inventory.services import receive_stock
from apps.products.models import Product
from apps.sales.models import SalesOrder, SalesOrderLine
from apps.sales.services import confirm_sales_order, deliver_sales_order


pytestmark = pytest.mark.django_db


def test_confirm_sales_order_reserves_stock():
    customer = Customer.objects.create(customer_code="CUST-100", name="Acme Furniture")
    product = Product.objects.create(name="Wooden Chair", sales_price=120, cost_price=80)
    receive_stock(product=product, quantity=10, reference="PO-100")

    order = SalesOrder.objects.create(reference="SO-100", customer=customer)
    SalesOrderLine.objects.create(
        order=order,
        product=product,
        quantity_ordered=4,
        unit_price=120,
    )

    confirm_sales_order(order)

    order.refresh_from_db()
    product.refresh_from_db()
    line = order.lines.get()

    assert order.status == SalesOrder.STATUS_CONFIRMED
    assert product.on_hand_quantity == 10
    assert product.reserved_quantity == 4
    assert product.free_to_use_quantity == 6
    assert line.quantity_reserved == 4
    assert line.quantity_delivered == 0


def test_deliver_sales_order_reduces_reserved_and_on_hand():
    customer = Customer.objects.create(customer_code="CUST-200", name="Home Decor")
    product = Product.objects.create(name="Dining Table", sales_price=250, cost_price=150)
    receive_stock(product=product, quantity=10, reference="PO-200")

    order = SalesOrder.objects.create(reference="SO-200", customer=customer)
    SalesOrderLine.objects.create(
        order=order,
        product=product,
        quantity_ordered=6,
        unit_price=250,
    )

    confirm_sales_order(order)
    deliver_sales_order(order, quantities_by_line={order.lines.get().pk: 2})

    order.refresh_from_db()
    product.refresh_from_db()
    line = order.lines.get()

    assert order.status == SalesOrder.STATUS_PARTIAL
    assert product.on_hand_quantity == 8
    assert product.reserved_quantity == 4
    assert line.quantity_delivered == 2
    assert line.quantity_reserved == 4

    deliver_sales_order(order)
    order.refresh_from_db()
    product.refresh_from_db()
    line.refresh_from_db()

    assert order.status == SalesOrder.STATUS_DONE
    assert product.on_hand_quantity == 4
    assert product.reserved_quantity == 0
    assert line.quantity_delivered == 6
    assert line.quantity_reserved == 0


def test_confirm_sales_order_blocks_when_stock_is_insufficient():
    customer = Customer.objects.create(customer_code="CUST-300", name="Office Supply")
    product = Product.objects.create(name="Office Desk", sales_price=180, cost_price=100)
    receive_stock(product=product, quantity=2, reference="PO-300")

    order = SalesOrder.objects.create(reference="SO-300", customer=customer)
    SalesOrderLine.objects.create(
        order=order,
        product=product,
        quantity_ordered=5,
        unit_price=180,
    )

    with pytest.raises(ValidationError):
        confirm_sales_order(order)


def test_confirm_sales_order_triggers_procurement_for_mto_shortage():
    customer = Customer.objects.create(customer_code="CUST-400", name="Factory Outlet")
    vendor = Vendor.objects.create(vendor_code="VEND-400", name="Supply Co")
    product = Product.objects.create(
        name="Custom Desk",
        sales_price=500,
        cost_price=300,
        procurement_strategy=Product.PROCUREMENT_MTO,
        procure_on_demand=True,
        procurement_type=Product.PROCUREMENT_PURCHASE,
        vendor=vendor,
    )

    order = SalesOrder.objects.create(reference="SO-400", customer=customer)
    SalesOrderLine.objects.create(order=order, product=product, quantity_ordered=3, unit_price=500)

    confirm_sales_order(order)

    order.refresh_from_db()
    assert order.status == SalesOrder.STATUS_CONFIRMED
    assert order.generated_purchase_orders.count() == 1
    assert order.generated_purchase_orders.first().created_by_system is True
