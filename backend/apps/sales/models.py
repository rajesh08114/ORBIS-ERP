from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.partners.models import Customer
from apps.products.models import Product


class SalesOrder(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_CONFIRMED = "confirmed"
    STATUS_PARTIAL = "partially_delivered"
    STATUS_DONE = "fully_delivered"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_PARTIAL, "Partially Delivered"),
        (STATUS_DONE, "Fully Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    reference = models.CharField(max_length=64, unique=True)
    customer = models.ForeignKey(
        Customer,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sales_orders",
    )
    salesperson = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sales_orders",
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def clean(self):
        if self.pk and self.status == self.STATUS_CANCELLED and self.lines.filter(quantity_delivered__gt=0).exists():
            raise ValidationError("Delivered orders cannot be cancelled.")

    @property
    def customer_name(self):
        return self.customer.name if self.customer else ""


class SalesOrderLine(models.Model):
    order = models.ForeignKey(SalesOrder, related_name="lines", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sales_order_lines")
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_reserved = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_delivered = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity_ordered__gt=0), name="sales_line_qty_ordered_gt_0"),
            models.CheckConstraint(check=models.Q(quantity_reserved__gte=0), name="sales_line_qty_reserved_gte_0"),
            models.CheckConstraint(check=models.Q(quantity_delivered__gte=0), name="sales_line_qty_delivered_gte_0"),
        ]

    def clean(self):
        if self.quantity_ordered <= 0:
            raise ValidationError("Ordered quantity must be greater than zero.")

    @property
    def quantity_remaining(self):
        return self.quantity_ordered - self.quantity_delivered

    @property
    def quantity_to_reserve(self):
        return self.quantity_ordered - self.quantity_reserved
