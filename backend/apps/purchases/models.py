from django.conf import settings
from django.db import models

from apps.partners.models import Vendor
from apps.products.models import Product


class PurchaseOrder(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_CONFIRMED = "confirmed"
    STATUS_PARTIAL = "partially_received"
    STATUS_DONE = "fully_received"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_PARTIAL, "Partially Received"),
        (STATUS_DONE, "Fully Received"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    reference = models.CharField(max_length=64, unique=True)
    vendor = models.ForeignKey(
        Vendor,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="purchase_orders",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="purchase_orders",
    )
    source_sales_order = models.ForeignKey(
        "sales.SalesOrder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generated_purchase_orders",
    )
    trigger_reason = models.CharField(max_length=255, blank=True)
    created_by_system = models.BooleanField(default=False)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    @property
    def vendor_name(self):
        return self.vendor.name if self.vendor else ""


class PurchaseOrderLine(models.Model):
    order = models.ForeignKey(PurchaseOrder, related_name="lines", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="purchase_order_lines")
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity_ordered__gt=0), name="purchase_line_qty_ordered_gt_0"),
            models.CheckConstraint(check=models.Q(quantity_received__gte=0), name="purchase_line_qty_received_gte_0"),
        ]

    @property
    def quantity_remaining(self):
        return self.quantity_ordered - self.quantity_received
