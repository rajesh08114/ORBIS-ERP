from django.urls import path

from apps.api_dashboard.api import (
    CancelRunAPIView,
    BlueprintAPIView,
    DashboardSummaryAPIView,
    DiscoveryAPIView,
    EndpointViewerAPIView,
    ExportRunAPIView,
    MeExtendedAPIView,
    RunDetailAPIView,
    RunTestsAPIView,
    TokenViewerAPIView,
)
from apps.api_dashboard.views import DashboardShellView, SignInView, SignUpView

urlpatterns = [
    path("", DashboardShellView.as_view(), name="api-dashboard-home"),
    path("signin/", SignInView.as_view(), name="api-dashboard-signin"),
    path("signup/", SignUpView.as_view(), name="api-dashboard-signup"),
    path("api/summary/", DashboardSummaryAPIView.as_view(), name="api-dashboard-summary"),
    path("api/blueprint/", BlueprintAPIView.as_view(), name="api-dashboard-blueprint"),
    path("api/discover/", DiscoveryAPIView.as_view(), name="api-dashboard-discover"),
    path("api/run/", RunTestsAPIView.as_view(), name="api-dashboard-run"),
    path("api/run/<int:run_id>/", RunDetailAPIView.as_view(), name="api-dashboard-run-detail"),
    path("api/run/<int:run_id>/cancel/", CancelRunAPIView.as_view(), name="api-dashboard-run-cancel"),
    path("api/run/<int:run_id>/export/", ExportRunAPIView.as_view(), name="api-dashboard-run-export"),
    path("api/run/<int:run_id>/result/<int:result_id>/", EndpointViewerAPIView.as_view(), name="api-dashboard-result"),
    path("api/token-viewer/", TokenViewerAPIView.as_view(), name="api-dashboard-token-viewer"),
    path("api/me/", MeExtendedAPIView.as_view(), name="api-dashboard-me"),
]
