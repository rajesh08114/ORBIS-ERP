from django.db import models

from apps.partners.models import Vendor


class Product(models.Model):
    PROCUREMENT_MTS = "mts"
    PROCUREMENT_MTO = "mto"
    PROCUREMENT_CHOICES = [
        (PROCUREMENT_MTS, "Make to Stock"),
        (PROCUREMENT_MTO, "Make to Order"),
    ]

    PROCUREMENT_PURCHASE = "purchase"
    PROCUREMENT_MANUFACTURE = "manufacture"
    PROCUREMENT_TYPE_CHOICES = [
        (PROCUREMENT_PURCHASE, "Purchase"),
        (PROCUREMENT_MANUFACTURE, "Manufacture"),
    ]

    name = models.CharField(max_length=255, unique=True)
    sku = models.CharField(max_length=64, unique=True, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    image = models.ImageField(upload_to="products/images/", null=True, blank=True)
    sales_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    on_hand_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reserved_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    procurement_strategy = models.CharField(
        max_length=3,
        choices=PROCUREMENT_CHOICES,
        default=PROCUREMENT_MTS,
    )
    procurement_type = models.CharField(
        max_length=16,
        choices=PROCUREMENT_TYPE_CHOICES,
        default=PROCUREMENT_PURCHASE,
    )
    procure_on_demand = models.BooleanField(default=False)
    vendor = models.ForeignKey(
        Vendor,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
    )
    default_bom = models.ForeignKey(
        "manufacturing.BillOfMaterial",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_products",
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(check=models.Q(sales_price__gte=0), name="product_sales_price_gte_0"),
            models.CheckConstraint(check=models.Q(cost_price__gte=0), name="product_cost_price_gte_0"),
            models.CheckConstraint(check=models.Q(on_hand_quantity__gte=0), name="product_on_hand_gte_0"),
            models.CheckConstraint(check=models.Q(reserved_quantity__gte=0), name="product_reserved_gte_0"),
            models.CheckConstraint(
                check=models.Q(reserved_quantity__lte=models.F("on_hand_quantity")),
                name="product_reserved_lte_on_hand",
            ),
        ]

    @property
    def free_to_use_quantity(self):
        return self.on_hand_quantity - self.reserved_quantity
