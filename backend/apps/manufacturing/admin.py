from django.contrib import admin

from apps.manufacturing.models import (
    BillOfMaterial,
    BillOfMaterialLine,
    Operation,
    ManufacturingOrder,
    ManufacturingOrderLine,
    WorkCenter,
    WorkOrder,
)


class BillOfMaterialLineInline(admin.TabularInline):
    model = BillOfMaterialLine
    extra = 0
    autocomplete_fields = ("component", "operation")


@admin.register(BillOfMaterial)
class BillOfMaterialAdmin(admin.ModelAdmin):
    list_display = ("code", "finished_product", "version", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("code", "finished_product__name")
    inlines = [BillOfMaterialLineInline]


class ManufacturingOrderLineInline(admin.TabularInline):
    model = ManufacturingOrderLine
    extra = 0
    autocomplete_fields = ("component",)


@admin.register(ManufacturingOrder)
class ManufacturingOrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "finished_product", "bom", "quantity", "status", "assignee", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "finished_product__name", "bom__code", "source_sales_order__reference")
    inlines = [ManufacturingOrderLineInline]


@admin.register(ManufacturingOrderLine)
class ManufacturingOrderLineAdmin(admin.ModelAdmin):
    list_display = ("order", "component", "quantity_required", "quantity_reserved", "quantity_consumed")
    search_fields = ("order__reference", "component__name")
    autocomplete_fields = ("order", "component")


@admin.register(WorkCenter)
class WorkCenterAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "description")
    search_fields = ("code", "name")


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ("name", "duration_minutes")
    search_fields = ("name",)


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ("manufacturing_order", "sequence", "operation", "work_center", "assignee", "status")
    list_filter = ("status",)
    search_fields = ("manufacturing_order__reference", "operation__name", "work_center__name")
