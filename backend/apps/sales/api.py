from decimal import Decimal

from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db import transaction

from apps.common.api import ERPActionPermission
from apps.common.permissions import SALES_CONFIRM, SALES_CREATE, SALES_DELIVER, SALES_VIEW
from apps.sales.models import SalesOrder, SalesOrderLine
from apps.sales.services import cancel_sales_order, confirm_sales_order, deliver_sales_order


class SalesOrderLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = SalesOrderLine
        fields = [
            "id",
            "order",
            "product",
            "product_name",
            "product_sku",
            "quantity_ordered",
            "quantity_reserved",
            "quantity_delivered",
            "unit_price",
        ]
        read_only_fields = ["id", "quantity_reserved", "quantity_delivered", "product_name", "product_sku"]


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(read_only=True)
    lines = SalesOrderLineSerializer(many=True, read_only=True)
    write_lines = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = SalesOrder
        fields = [
            "id",
            "reference",
            "customer",
            "customer_name",
            "status",
            "notes",
            "created_at",
            "confirmed_at",
            "delivered_at",
            "lines",
            "write_lines",
        ]
        read_only_fields = ["id", "status", "created_at", "confirmed_at", "delivered_at", "customer_name", "lines"]

    @transaction.atomic
    def create(self, validated_data):
        write_lines = validated_data.pop("write_lines", [])
        order = super().create(validated_data)
        
        for line_data in write_lines:
            SalesOrderLine.objects.create(
                order=order,
                product_id=line_data.get("product"),
                quantity_ordered=line_data.get("quantity_ordered", 1),
                unit_price=line_data.get("unit_price", 0)
            )
            
        return order


class SalesOrderLineListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderLine
        fields = [
            "id",
            "order",
            "product",
            "quantity_ordered",
            "quantity_reserved",
            "quantity_delivered",
            "unit_price",
        ]
        read_only_fields = ["id", "quantity_reserved", "quantity_delivered"]


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.select_related("customer").prefetch_related("lines__product")
    serializer_class = SalesOrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["reference", "customer__name", "customer__customer_code"]
    ordering_fields = ["reference", "created_at", "confirmed_at", "delivered_at", "status"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [SALES_VIEW],
        "retrieve": [SALES_VIEW],
        "create": [SALES_CREATE],
        "update": [SALES_CREATE],
        "partial_update": [SALES_CREATE],
        "destroy": [SALES_CREATE],
        "confirm": [SALES_CONFIRM],
        "deliver": [SALES_DELIVER],
        "cancel": [SALES_CONFIRM],
    }

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()
        confirm_sales_order(order)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        order = self.get_object()
        quantities_by_line = {}
        payload = request.data.get("lines", [])
        if isinstance(payload, list):
            for item in payload:
                line_id = item.get("line_id")
                if line_id is None:
                    continue
                quantities_by_line[int(line_id)] = Decimal(str(item.get("quantity", 0)))
        deliver_sales_order(order, quantities_by_line=quantities_by_line or None)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        cancel_sales_order(order)
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)


class SalesOrderLineViewSet(viewsets.ModelViewSet):
    queryset = SalesOrderLine.objects.select_related("order", "product")
    serializer_class = SalesOrderLineListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order__reference", "product__name", "product__sku"]
    ordering_fields = ["id", "quantity_ordered", "quantity_reserved", "quantity_delivered"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [SALES_VIEW],
        "retrieve": [SALES_VIEW],
        "create": [SALES_CREATE],
        "update": [SALES_CREATE],
        "partial_update": [SALES_CREATE],
        "destroy": [SALES_CREATE],
    }

