from django.conf import settings
from django.db import models

from apps.products.models import Product


class StockMovement(models.Model):
    TYPE_RECEIPT = "receipt"
    TYPE_DELIVERY = "delivery"
    TYPE_RESERVATION = "reservation"
    TYPE_RELEASE = "release"
    TYPE_ADJUSTMENT = "adjustment"
    TYPE_CONSUMPTION = "consumption"
    TYPE_PRODUCTION = "production"
    TYPE_CHOICES = [
        (TYPE_RECEIPT, "Receipt"),
        (TYPE_DELIVERY, "Delivery"),
        (TYPE_RESERVATION, "Reservation"),
        (TYPE_RELEASE, "Release"),
        (TYPE_ADJUSTMENT, "Adjustment"),
        (TYPE_CONSUMPTION, "Consumption"),
        (TYPE_PRODUCTION, "Production"),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_movements",
        null=True,
        blank=True,
    )
    reference_type = models.CharField(max_length=64, blank=True)
    reference_id = models.CharField(max_length=64, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    movement_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    reference = models.CharField(max_length=64, blank=True)
    on_hand_delta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reserved_delta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    on_hand_before = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    on_hand_after = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reserved_before = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reserved_after = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="stock_movements",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "stock movement"
        verbose_name_plural = "stock movements"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["reference_type", "reference_id"]),
            models.Index(fields=["product", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(quantity__gte=0), name="stock_movement_qty_gte_0"),
            models.CheckConstraint(check=models.Q(on_hand_after__gte=0), name="stock_movement_on_hand_after_gte_0"),
            models.CheckConstraint(check=models.Q(reserved_after__gte=0), name="stock_movement_reserved_after_gte_0"),
        ]

    def save(self, *args, **kwargs):
        if self.pk and not kwargs.pop("allow_update", False):
            raise ValueError("Stock movements are immutable.")
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        raise ValueError("Stock movements are immutable.")
