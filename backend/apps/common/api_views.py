from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.api import ERPActionPermission
from apps.common.dashboard import get_dashboard_metrics
from apps.common.permissions import DASHBOARD_VIEW


class DashboardAPIView(APIView):
    schema = None
    permission_classes = [IsAuthenticated, ERPActionPermission]
    required_permissions = {"get": [DASHBOARD_VIEW]}

    def get(self, request):
        return Response(get_dashboard_metrics())
