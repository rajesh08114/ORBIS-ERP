import pytest

from apps.inventory.models import StockMovement
from apps.inventory.services import deliver_stock, receive_stock, release_stock, reserve_stock
from apps.products.models import Product


pytestmark = pytest.mark.django_db


def test_receive_stock_updates_product_and_ledger():
    product = Product.objects.create(name="Wooden Table", sales_price=100, cost_price=70)

    movement = receive_stock(product=product, quantity=10, reference="PO-001")

    product.refresh_from_db()
    assert product.on_hand_quantity == 10
    assert product.reserved_quantity == 0
    assert movement.movement_type == StockMovement.TYPE_RECEIPT
    assert movement.on_hand_before == 0
    assert movement.on_hand_after == 10


def test_reserve_and_release_stock_updates_reserved_balance():
    product = Product.objects.create(name="Office Chair", sales_price=80, cost_price=45)
    receive_stock(product=product, quantity=10)

    reserve_stock(product=product, quantity=4, reference="SO-001")
    product.refresh_from_db()
    assert product.on_hand_quantity == 10
    assert product.reserved_quantity == 4
    assert product.free_to_use_quantity == 6

    release_stock(product=product, quantity=1, reference="SO-001")
    product.refresh_from_db()
    assert product.reserved_quantity == 3


def test_deliver_stock_decreases_on_hand():
    product = Product.objects.create(name="Dining Table", sales_price=140, cost_price=90)
    receive_stock(product=product, quantity=12)

    deliver_stock(product=product, quantity=5, reference="SO-002")
    product.refresh_from_db()
    assert product.on_hand_quantity == 7


def test_stock_movement_is_immutable():
    product = Product.objects.create(name="Shelf", sales_price=50, cost_price=25)
    movement = receive_stock(product=product, quantity=3, reference="PO-010")

    movement.notes = "tamper"
    with pytest.raises(ValueError):
        movement.save()

    with pytest.raises(ValueError):
        movement.delete()
