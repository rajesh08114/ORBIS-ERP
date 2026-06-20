from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.dashboard import get_dashboard_metrics


class DashboardAPIView(APIView):
    schema = None
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_dashboard_metrics(request.user))
