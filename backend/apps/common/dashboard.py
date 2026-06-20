from django.db.models import DecimalField, ExpressionWrapper, F, Sum, Value, Q
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.inventory.models import StockMovement
from apps.manufacturing.models import ManufacturingOrder, BillOfMaterial
from apps.products.models import Product
from apps.purchases.models import PurchaseOrder
from apps.sales.models import SalesOrder


def get_dashboard_metrics(user=None):
    now = timezone.now()
    inventory_value = Product.objects.aggregate(
        total=Coalesce(
            Sum(
                ExpressionWrapper(
                    F("on_hand_quantity") * F("cost_price"),
                    output_field=DecimalField(max_digits=18, decimal_places=2),
                )
            ),
            Value(0, output_field=DecimalField(max_digits=18, decimal_places=2)),
        )
    )["total"]

    top_selling_products = list(
        Product.objects.annotate(
            sold_qty=Coalesce(
                Sum("sales_order_lines__quantity_delivered"),
                Value(0, output_field=DecimalField(max_digits=18, decimal_places=2)),
            ),
        )
        .filter(sold_qty__gt=0)
        .order_by("-sold_qty", "name")
        .values("id", "name", "sku", "sold_qty")[:5]
    )

    sales_qs = SalesOrder.objects.all()
    my_sales_qs = sales_qs.filter(salesperson=user) if user and user.is_authenticated else sales_qs.none()
    
    def get_sales_metrics(qs):
        return {
            "draft": qs.filter(status=SalesOrder.STATUS_DRAFT).count(),
            "confirmed": qs.filter(status=SalesOrder.STATUS_CONFIRMED).count(),
            "partially_delivered": qs.filter(status=SalesOrder.STATUS_PARTIAL).count(),
            "delivered": qs.filter(status=SalesOrder.STATUS_DONE).count(),
            "late": qs.filter(
                scheduled_date__lt=now,
                status__in=[SalesOrder.STATUS_DRAFT, SalesOrder.STATUS_CONFIRMED, SalesOrder.STATUS_PARTIAL]
            ).count(),
        }

    purchases_qs = PurchaseOrder.objects.all()
    my_purchases_qs = purchases_qs.filter(assignee=user) if user and user.is_authenticated else purchases_qs.none()
    
    def get_purchases_metrics(qs):
        return {
            "draft": qs.filter(status=PurchaseOrder.STATUS_DRAFT).count(),
            "confirmed": qs.filter(status=PurchaseOrder.STATUS_CONFIRMED).count(),
            "partially_received": qs.filter(status=PurchaseOrder.STATUS_PARTIAL).count(),
            "received": qs.filter(status=PurchaseOrder.STATUS_DONE).count(),
            "late": qs.filter(
                scheduled_date__lt=now,
                status__in=[PurchaseOrder.STATUS_DRAFT, PurchaseOrder.STATUS_CONFIRMED, PurchaseOrder.STATUS_PARTIAL]
            ).count(),
        }

    mfg_qs = ManufacturingOrder.objects.all()
    my_mfg_qs = mfg_qs.filter(assignee=user) if user and user.is_authenticated else mfg_qs.none()
    
    def get_mfg_metrics(qs):
        return {
            "draft": qs.filter(status=ManufacturingOrder.STATUS_DRAFT).count(),
            "confirmed": qs.filter(status=ManufacturingOrder.STATUS_CONFIRMED).count(),
            "in_progress": qs.filter(status=ManufacturingOrder.STATUS_IN_PROGRESS).count(),
            "to_close": qs.filter(status=ManufacturingOrder.STATUS_TO_CLOSE).count(),
            "done": qs.filter(status=ManufacturingOrder.STATUS_DONE).count(),
            "late": qs.filter(
                scheduled_date__lt=now,
                status__in=[ManufacturingOrder.STATUS_DRAFT, ManufacturingOrder.STATUS_CONFIRMED, ManufacturingOrder.STATUS_IN_PROGRESS]
            ).count(),
        }

    return {
        "products": {
            "total": Product.objects.count(),
            "on_hand_quantity": str(Product.objects.aggregate(total=Sum("on_hand_quantity"))["total"] or 0),
            "reserved_quantity": str(Product.objects.aggregate(total=Sum("reserved_quantity"))["total"] or 0),
            "low_stock": Product.objects.annotate(
                free_qty=F("on_hand_quantity") - F("reserved_quantity")
            ).filter(free_qty__lte=5).count(),
        },
        "sales": {
            "all": get_sales_metrics(sales_qs),
            "my": get_sales_metrics(my_sales_qs),
        },
        "purchases": {
            "all": get_purchases_metrics(purchases_qs),
            "my": get_purchases_metrics(my_purchases_qs),
        },
        "manufacturing": {
            "all": get_mfg_metrics(mfg_qs),
            "my": get_mfg_metrics(my_mfg_qs),
        },
        "procurement": {
            "triggered": PurchaseOrder.objects.filter(created_by_system=True).count()
            + ManufacturingOrder.objects.filter(created_by_system=True).count(),
        },
        "inventory_value": str(inventory_value or 0),
        "top_selling_products": top_selling_products,
        "boms": {
            "total": BillOfMaterial.objects.count(),
            "active": BillOfMaterial.objects.filter(is_active=True).count(),
        },
        "stock_movements": {
            "total": StockMovement.objects.count(),
            "recent": [
                {
                    "created_at": movement.created_at.isoformat(),
                    "product_id": movement.product_id,
                    "movement_type": movement.movement_type,
                    "on_hand_delta": str(movement.on_hand_delta),
                    "reserved_delta": str(movement.reserved_delta),
                    "reference": movement.reference,
                }
                for movement in StockMovement.objects.order_by("-created_at", "-id")[:10]
            ],
        },
    }

