from rest_framework import serializers

from apps.common.dashboard import get_dashboard_metrics


class DashboardSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return get_dashboard_metrics()

