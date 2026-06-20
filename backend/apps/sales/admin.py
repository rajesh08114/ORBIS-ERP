from django.contrib import admin

from apps.sales.models import SalesOrder, SalesOrderLine


class SalesOrderLineInline(admin.TabularInline):
    model = SalesOrderLine
    extra = 0
    autocomplete_fields = ("product",)


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer_name", "status", "created_at", "confirmed_at", "delivered_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "customer__name", "customer__customer_code", "lines__product__name")
    inlines = [SalesOrderLineInline]


@admin.register(SalesOrderLine)
class SalesOrderLineAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity_ordered", "quantity_reserved", "quantity_delivered", "unit_price")
    search_fields = ("order__reference", "product__name", "product__sku")
    autocomplete_fields = ("order", "product")
