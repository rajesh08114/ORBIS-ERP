from django.contrib import admin

from apps.purchases.models import PurchaseOrder, PurchaseOrderLine


class PurchaseOrderLineInline(admin.TabularInline):
    model = PurchaseOrderLine
    extra = 0
    autocomplete_fields = ("product",)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "vendor_name", "status", "created_at", "confirmed_at", "received_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "vendor__name", "vendor__vendor_code", "lines__product__name")
    inlines = [PurchaseOrderLineInline]


@admin.register(PurchaseOrderLine)
class PurchaseOrderLineAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity_ordered", "quantity_received", "unit_cost")
    search_fields = ("order__reference", "product__name", "product__sku")
    autocomplete_fields = ("order", "product")
