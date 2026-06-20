from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.audit.api import AuditEntryViewSet, AuditLogViewSet
from apps.common.auth_api import LoginAPIView, LogoutAPIView, MeAPIView, RegisterAPIView, ChangePasswordAPIView
from apps.common.api_views import DashboardAPIView
from apps.common.backend_api import (
    AuditEntityAPIView,
    AuditExportAPIView,
    AuditSummaryAPIView,
    EntityExportAPIView,
    EntityFormMetadataAPIView,
    ResourceIndexAPIView,
    UnifiedAvatarUploadAPIView,
    UnifiedProfileAPIView,
)
from apps.inventory.api import StockMovementViewSet
from apps.manufacturing.api import (
    BillOfMaterialLineViewSet,
    BillOfMaterialViewSet,
    ManufacturingOrderLineViewSet,
    ManufacturingOrderViewSet,
    OperationViewSet,
    WorkCenterViewSet,
    WorkOrderViewSet,
)
from apps.partners.api import CustomerViewSet, VendorViewSet
from apps.products.api import ProductViewSet
from apps.purchases.api import PurchaseOrderLineViewSet, PurchaseOrderViewSet
from apps.sales.api import SalesOrderLineViewSet, SalesOrderViewSet
from apps.users.api import GroupViewSet, PermissionViewSet
from apps.users.api_admin import UserAdminViewSet


router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("vendors", VendorViewSet, basename="vendor")
router.register("products", ProductViewSet, basename="product")
router.register("sales-orders", SalesOrderViewSet, basename="sales-order")
router.register("sales-order-lines", SalesOrderLineViewSet, basename="sales-order-line")
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register("purchase-order-lines", PurchaseOrderLineViewSet, basename="purchase-order-line")
router.register("work-centers", WorkCenterViewSet, basename="work-center")
router.register("operations", OperationViewSet, basename="operation")
router.register("boms", BillOfMaterialViewSet, basename="bom")
router.register("bom-lines", BillOfMaterialLineViewSet, basename="bom-line")
router.register("manufacturing-orders", ManufacturingOrderViewSet, basename="manufacturing-order")
router.register("manufacturing-order-lines", ManufacturingOrderLineViewSet, basename="manufacturing-order-line")
router.register("work-orders", WorkOrderViewSet, basename="work-order")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")
router.register("audit-entries", AuditEntryViewSet, basename="audit-entry")
router.register("users", UserAdminViewSet, basename="user-admin")
router.register("roles", GroupViewSet, basename="role")
router.register("permissions", PermissionViewSet, basename="permission")

urlpatterns = [
    path("auth/login/", LoginAPIView.as_view(), name="api-login"),
    path("auth/register/", RegisterAPIView.as_view(), name="api-register"),
    path("auth/me/", MeAPIView.as_view(), name="api-me"),
    path("auth/logout/", LogoutAPIView.as_view(), name="api-logout"),
    path("auth/change-password/", ChangePasswordAPIView.as_view(), name="api-change-password"),
    path("dashboard/", DashboardAPIView.as_view(), name="api-dashboard"),
    path("resources/", ResourceIndexAPIView.as_view(), name="api-resource-index"),
    path("forms/<slug:resource>/", EntityFormMetadataAPIView.as_view(), name="api-form-metadata"),
    path("forms/<slug:resource>/<int:pk>/", EntityFormMetadataAPIView.as_view(), name="api-form-metadata-detail"),
    path("exports/<slug:resource>/", EntityExportAPIView.as_view(), name="api-resource-export"),
    path("profiles/me/", UnifiedProfileAPIView.as_view(), name="api-profile-me"),
    path("profiles/me/avatar/", UnifiedAvatarUploadAPIView.as_view(), name="api-profile-avatar"),
    path("audit/summary/", AuditSummaryAPIView.as_view(), name="api-audit-summary"),
    path("audit/entity/<slug:entity_name>/<str:entity_id>/", AuditEntityAPIView.as_view(), name="api-audit-entity"),
    path("audit/export/", AuditExportAPIView.as_view(), name="api-audit-export"),
]

urlpatterns += router.urls
