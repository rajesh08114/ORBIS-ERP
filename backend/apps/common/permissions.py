from django.core.exceptions import PermissionDenied


PRODUCT_VIEW = "products.view_product"
PRODUCT_CREATE = "products.add_product"
PRODUCT_EDIT = "products.change_product"
PRODUCT_DELETE = "products.delete_product"

CUSTOMER_VIEW = "partners.view_customer"
CUSTOMER_CREATE = "partners.add_customer"
CUSTOMER_EDIT = "partners.change_customer"
CUSTOMER_DELETE = "partners.delete_customer"

VENDOR_VIEW = "partners.view_vendor"
VENDOR_CREATE = "partners.add_vendor"
VENDOR_EDIT = "partners.change_vendor"
VENDOR_DELETE = "partners.delete_vendor"

SALES_VIEW = "sales.view_salesorder"
SALES_CREATE = "sales.add_salesorder"
SALES_CONFIRM = "sales.change_salesorder"
SALES_DELIVER = "sales.change_salesorder"

PURCHASE_VIEW = "purchases.view_purchaseorder"
PURCHASE_CREATE = "purchases.add_purchaseorder"
PURCHASE_RECEIVE = "purchases.change_purchaseorder"

MANUFACTURING_VIEW = "manufacturing.view_manufacturingorder"
MANUFACTURING_CREATE = "manufacturing.add_manufacturingorder"
MANUFACTURING_EXECUTE = "manufacturing.change_manufacturingorder"

INVENTORY_VIEW = "inventory.view_stockmovement"
INVENTORY_ADJUST = "inventory.change_stockmovement"

AUDIT_VIEW = "audit.view_auditlog"
DASHBOARD_VIEW = "common.view_dashboard"


def require_permission(user, permission: str) -> None:
    if not user or not getattr(user, "is_authenticated", False):
        raise PermissionDenied("Forbidden")
    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return
    if not user.has_perm(permission):
        raise PermissionDenied("Forbidden")
