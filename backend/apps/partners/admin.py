from django.contrib import admin

from apps.partners.models import Customer, Vendor


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("customer_code", "name", "email", "phone", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("customer_code", "name", "email", "phone")


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("vendor_code", "name", "email", "phone", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("vendor_code", "name", "email", "phone")

