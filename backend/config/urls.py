from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.dashboard import get_dashboard_metrics
from apps.common.permissions import require_permission, DASHBOARD_VIEW
from apps.common.services_check import check_services


def healthcheck(_request):
    return JsonResponse({"status": "ok", "service": "mini-erp"})


def readiness(_request):
    return JsonResponse({"status": "ready" if check_services() else "degraded"})


def dashboard(request):
    try:
        require_permission(getattr(request, "user", None), DASHBOARD_VIEW)
    except PermissionDenied:
        return JsonResponse({"success": False, "message": "Forbidden"}, status=403)
    return JsonResponse(get_dashboard_metrics())


urlpatterns = [
    path("", healthcheck, name="healthcheck"),
    path("health/ready/", readiness, name="readiness"),
    path("dashboard/", dashboard, name="dashboard"),
    path("sanity-dashboard/", include("apps.api_dashboard.urls")),
    path("api/", include("config.api_urls")),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="api-token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="api-token-refresh"),
    path("api/auth/token/blacklist/", TokenBlacklistView.as_view(), name="api-token-blacklist"),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),
    path("admin/", admin.site.urls),
]
