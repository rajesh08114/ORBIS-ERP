from decimal import Decimal

from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.api import ERPActionPermission
from apps.common.permissions import INVENTORY_ADJUST, INVENTORY_VIEW
from apps.inventory.models import StockMovement
from apps.inventory.services import adjust_stock
from apps.products.models import Product


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "reference_type",
            "reference_id",
            "quantity",
            "movement_type",
            "reference",
            "on_hand_delta",
            "reserved_delta",
            "on_hand_before",
            "on_hand_after",
            "reserved_before",
            "reserved_after",
            "notes",
            "created_by",
            "created_at",
        ]
        read_only_fields = fields


class StockAdjustmentSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    on_hand_delta = serializers.DecimalField(max_digits=12, decimal_places=2)
    reserved_delta = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=Decimal("0"))
    reference = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related("product", "created_by")
    serializer_class = StockMovementSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["reference", "reference_type", "reference_id", "product__name", "product__sku", "notes"]
    ordering_fields = ["created_at", "quantity", "movement_type"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [INVENTORY_VIEW], "retrieve": [INVENTORY_VIEW], "adjust": [INVENTORY_ADJUST]}

    @action(detail=False, methods=["post"])
    def adjust(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movement = adjust_stock(
            product=serializer.validated_data["product"],
            on_hand_delta=serializer.validated_data["on_hand_delta"],
            reserved_delta=serializer.validated_data["reserved_delta"],
            reference=serializer.validated_data["reference"],
            notes=serializer.validated_data["notes"],
        )
        return Response(StockMovementSerializer(movement, context=self.get_serializer_context()).data)

