from django.contrib import admin

from apps.inventory.models import StockMovement
from apps.products.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "sales_price",
        "cost_price",
        "on_hand_quantity",
        "reserved_quantity",
        "free_to_use_quantity",
        "procurement_strategy",
        "procurement_type",
        "vendor",
        "default_bom",
    )
    search_fields = ("name", "sku")
    list_filter = ("procurement_strategy", "procurement_type")

    @admin.display(ordering="on_hand_quantity")
    def free_to_use_quantity(self, obj):
        return obj.free_to_use_quantity


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "product",
        "movement_type",
        "reference",
        "on_hand_delta",
        "reserved_delta",
        "on_hand_before",
        "on_hand_after",
        "reserved_before",
        "reserved_after",
    )
    search_fields = ("product__name", "product__sku", "reference", "notes")
    list_filter = ("movement_type", "created_at")
    autocomplete_fields = ("product",)
