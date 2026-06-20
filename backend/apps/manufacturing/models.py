from django.db import models
from django.conf import settings

from apps.products.models import Product


class WorkCenter(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]


class Operation(models.Model):
    name = models.CharField(max_length=255, unique=True)
    duration_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]


class BillOfMaterial(models.Model):
    code = models.CharField(max_length=64, unique=True)
    finished_product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="boms",
    )
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class BillOfMaterialLine(models.Model):
    bom = models.ForeignKey(BillOfMaterial, related_name="lines", on_delete=models.CASCADE)
    component = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="bom_component_lines")
    quantity_required = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    operation = models.ForeignKey(
        Operation,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="bom_lines",
    )
    sequence = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity_required__gt=0), name="bom_line_qty_required_gt_0"),
        ]


class ManufacturingOrder(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_CONFIRMED = "confirmed"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_DONE = "done"
    STATUS_TO_CLOSE = "to_close"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_DONE, "Done"),
        (STATUS_TO_CLOSE, "To Close"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    reference = models.CharField(max_length=64, unique=True)
    bom = models.ForeignKey(
        BillOfMaterial,
        on_delete=models.PROTECT,
        related_name="manufacturing_orders",
        null=True,
        blank=True,
    )
    finished_product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="manufacturing_orders",
        null=True,
        blank=True,
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="manufacturing_orders",
    )
    source_sales_order = models.ForeignKey(
        "sales.SalesOrder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generated_manufacturing_orders",
    )
    trigger_reason = models.CharField(max_length=255, blank=True)
    created_by_system = models.BooleanField(default=False)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity__gte=0), name="manufacturing_order_qty_gte_0"),
        ]


class ManufacturingOrderLine(models.Model):
    order = models.ForeignKey(ManufacturingOrder, related_name="component_lines", on_delete=models.CASCADE)
    component = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="manufacturing_component_lines")
    quantity_required = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_reserved = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_consumed = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity_required__gte=0), name="manufacturing_line_qty_required_gte_0"),
            models.CheckConstraint(check=models.Q(quantity_reserved__gte=0), name="manufacturing_line_qty_reserved_gte_0"),
            models.CheckConstraint(check=models.Q(quantity_consumed__gte=0), name="manufacturing_line_qty_consumed_gte_0"),
        ]


class WorkOrder(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_READY = "ready"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_DONE = "done"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_READY, "Ready"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_DONE, "Done"),
    ]

    manufacturing_order = models.ForeignKey(
        ManufacturingOrder,
        related_name="work_orders",
        on_delete=models.CASCADE,
    )
    operation = models.ForeignKey(
        Operation,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="work_orders",
    )
    work_center = models.ForeignKey(
        WorkCenter,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="work_orders",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="work_orders",
    )
    sequence = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["sequence", "id"]
