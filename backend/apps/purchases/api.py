from decimal import Decimal

from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from apps.common.api import ERPActionPermission
from apps.common.permissions import PURCHASE_CREATE, PURCHASE_RECEIVE, PURCHASE_VIEW
from apps.purchases.models import PurchaseOrder, PurchaseOrderLine
from apps.purchases.services import cancel_purchase_order, confirm_purchase_order, receive_purchase_order


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = PurchaseOrderLine
        fields = [
            "id",
            "order",
            "product",
            "product_name",
            "product_sku",
            "quantity_ordered",
            "quantity_received",
            "unit_cost",
        ]
        read_only_fields = ["id", "quantity_received", "product_name", "product_sku"]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(read_only=True)
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    write_lines = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "reference",
            "vendor",
            "vendor_name",
            "source_sales_order",
            "source_manufacturing_order",
            "trigger_reason",
            "created_by_system",
            "status",
            "notes",
            "created_at",
            "confirmed_at",
            "received_at",
            "lines",
            "write_lines",
        ]
        read_only_fields = ["id", "status", "created_at", "confirmed_at", "received_at", "vendor_name", "lines"]

    @transaction.atomic
    def create(self, validated_data):
        write_lines = validated_data.pop("write_lines", [])
        order = super().create(validated_data)
        
        for line_data in write_lines:
            PurchaseOrderLine.objects.create(
                order=order,
                product_id=line_data.get("product"),
                quantity_ordered=line_data.get("quantity_ordered", 1),
                unit_cost=line_data.get("unit_cost", 0)
            )
            
        return order


class PurchaseOrderLineListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderLine
        fields = [
            "id",
            "order",
            "product",
            "quantity_ordered",
            "quantity_received",
            "unit_cost",
        ]
        read_only_fields = ["id", "quantity_received"]


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related("vendor", "source_sales_order").prefetch_related("lines__product")
    serializer_class = PurchaseOrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["reference", "vendor__name", "vendor__vendor_code"]
    ordering_fields = ["reference", "created_at", "confirmed_at", "received_at", "status"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [PURCHASE_VIEW],
        "retrieve": [PURCHASE_VIEW],
        "create": [PURCHASE_CREATE],
        "update": [PURCHASE_CREATE],
        "partial_update": [PURCHASE_CREATE],
        "destroy": [PURCHASE_CREATE],
        "confirm": [PURCHASE_CREATE],
        "receive": [PURCHASE_RECEIVE],
        "cancel": [PURCHASE_CREATE],
    }

    def perform_create(self, serializer):
        from apps.audit.services import log_audit_event
        instance = serializer.save(assignee=self.request.user)
        log_audit_event(
            entity_name="PurchaseOrder",
            entity_id=str(instance.pk),
            action="created",
            details=serializer.data,
        )

    def perform_update(self, serializer):
        from apps.audit.services import audit_update
        instance = self.get_object()
        audit_update(instance, serializer, "PurchaseOrder")

    def perform_destroy(self, instance):
        from apps.audit.services import log_audit_event
        pk = instance.pk
        ref = instance.reference
        instance.delete()
        log_audit_event(
            entity_name="PurchaseOrder",
            entity_id=str(pk),
            action="deleted",
            details={"reference": ref},
        )

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()
        try:
            confirm_purchase_order(order)
            return Response(self.get_serializer(order).data)
        except (DjangoValidationError, ValueError) as e:
            raise DRFValidationError(detail=str(e))

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        order = self.get_object()
        quantities_by_line = {}
        payload = request.data.get("lines", [])
        if isinstance(payload, list):
            for item in payload:
                line_id = item.get("line_id")
                if line_id is None:
                    continue
                quantities_by_line[int(line_id)] = Decimal(str(item.get("quantity", 0)))
        try:
            receive_purchase_order(order, quantities_by_line=quantities_by_line or None)
            return Response(self.get_serializer(order).data)
        except (DjangoValidationError, ValueError) as e:
            raise DRFValidationError(detail=str(e))

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            cancel_purchase_order(order)
            return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)
        except (DjangoValidationError, ValueError) as e:
            raise DRFValidationError(detail=str(e))


class PurchaseOrderLineViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderLine.objects.select_related("order", "product")
    serializer_class = PurchaseOrderLineListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order__reference", "product__name", "product__sku"]
    ordering_fields = ["id", "quantity_ordered", "quantity_received"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [PURCHASE_VIEW],
        "retrieve": [PURCHASE_VIEW],
        "create": [PURCHASE_CREATE],
        "update": [PURCHASE_CREATE],
        "partial_update": [PURCHASE_CREATE],
        "destroy": [PURCHASE_CREATE],
    }

