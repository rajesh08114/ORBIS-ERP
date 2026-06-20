from decimal import Decimal

from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import audit_update
from apps.common.api import ERPActionPermission
from apps.common.permissions import MANUFACTURING_CREATE, MANUFACTURING_EXECUTE, MANUFACTURING_VIEW
from apps.manufacturing.models import (
    BillOfMaterial,
    BillOfMaterialLine,
    ManufacturingOrder,
    ManufacturingOrderLine,
    Operation,
    WorkCenter,
    WorkOrder,
)
from apps.manufacturing.services import (
    complete_manufacturing_order,
    complete_work_order,
    confirm_manufacturing_order,
    create_manufacturing_order,
    start_manufacturing_order,
)


class OperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operation
        fields = ["id", "name", "duration_minutes"]


class WorkCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCenter
        fields = ["id", "code", "name", "description"]


class BillOfMaterialLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillOfMaterialLine
        fields = ["id", "bom", "component", "quantity_required", "operation", "sequence"]
        read_only_fields = ["id"]


class BillOfMaterialSerializer(serializers.ModelSerializer):
    lines = BillOfMaterialLineSerializer(many=True, read_only=True)

    class Meta:
        model = BillOfMaterial
        fields = ["id", "code", "finished_product", "version", "is_active", "notes", "created_at", "lines"]
        read_only_fields = ["id", "created_at", "lines"]


class ManufacturingOrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManufacturingOrderLine
        fields = ["id", "order", "component", "quantity_required", "quantity_reserved", "quantity_consumed"]
        read_only_fields = ["id", "quantity_reserved", "quantity_consumed"]


class WorkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "manufacturing_order",
            "operation",
            "work_center",
            "assignee",
            "sequence",
            "status",
            "notes",
        ]
        read_only_fields = ["id"]


class ManufacturingOrderSerializer(serializers.ModelSerializer):
    lines = ManufacturingOrderLineSerializer(source="component_lines", many=True, read_only=True)
    work_orders = WorkOrderSerializer(many=True, read_only=True)

    class Meta:
        model = ManufacturingOrder
        fields = [
            "id",
            "reference",
            "bom",
            "finished_product",
            "quantity",
            "assignee",
            "source_sales_order",
            "trigger_reason",
            "created_by_system",
            "status",
            "notes",
            "created_at",
            "confirmed_at",
            "completed_at",
            "lines",
            "work_orders",
        ]
        read_only_fields = [
            "id",
            "finished_product",
            "status",
            "created_at",
            "confirmed_at",
            "completed_at",
            "lines",
            "work_orders",
        ]


class ManufacturingOrderViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingOrder.objects.select_related("bom", "finished_product", "assignee").prefetch_related(
        "component_lines__component", "work_orders__operation", "work_orders__work_center"
    )
    serializer_class = ManufacturingOrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["reference", "finished_product__name", "bom__code"]
    ordering_fields = ["reference", "created_at", "confirmed_at", "completed_at", "status"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
        "confirm": [MANUFACTURING_EXECUTE],
        "start": [MANUFACTURING_EXECUTE],
        "complete": [MANUFACTURING_EXECUTE],
    }

    def perform_create(self, serializer):
        bom = serializer.validated_data["bom"]
        quantity = serializer.validated_data["quantity"]
        notes = serializer.validated_data.get("notes", "")
        source_sales_order = serializer.validated_data.get("source_sales_order")
        trigger_reason = serializer.validated_data.get("trigger_reason", "")
        created_by_system = serializer.validated_data.get("created_by_system", False)
        order = create_manufacturing_order(
            reference=serializer.validated_data["reference"],
            bom=bom,
            quantity=quantity,
            notes=notes,
            source_sales_order=source_sales_order,
            trigger_reason=trigger_reason,
            created_by_system=created_by_system,
        )
        serializer.instance = order

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        order = self.get_object()
        confirm_manufacturing_order(order)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        order = self.get_object()
        start_manufacturing_order(order)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        order = self.get_object()
        complete_manufacturing_order(order)
        return Response(self.get_serializer(order).data)


class BillOfMaterialViewSet(viewsets.ModelViewSet):
    queryset = BillOfMaterial.objects.select_related("finished_product").prefetch_related("lines__component", "lines__operation")
    serializer_class = BillOfMaterialSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "finished_product__name"]
    ordering_fields = ["code", "version", "created_at"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
    }

    def perform_update(self, serializer):
        audit_update(self.get_object(), serializer, "BillOfMaterial")


class BillOfMaterialLineViewSet(viewsets.ModelViewSet):
    queryset = BillOfMaterialLine.objects.select_related("bom", "component", "operation")
    serializer_class = BillOfMaterialLineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["bom__code", "component__name"]
    ordering_fields = ["sequence", "quantity_required"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
    }

    def perform_update(self, serializer):
        audit_update(self.get_object(), serializer, "BillOfMaterialLine")


class ManufacturingOrderLineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ManufacturingOrderLine.objects.select_related("order", "component")
    serializer_class = ManufacturingOrderLineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order__reference", "component__name"]
    ordering_fields = ["quantity_required", "quantity_reserved", "quantity_consumed"]
    permission_classes = [ERPActionPermission]
    required_permissions = {"list": [MANUFACTURING_VIEW], "retrieve": [MANUFACTURING_VIEW]}


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related("manufacturing_order", "operation", "work_center", "assignee")
    serializer_class = WorkOrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["manufacturing_order__reference", "operation__name", "work_center__name"]
    ordering_fields = ["sequence", "status"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
        "complete": [MANUFACTURING_EXECUTE],
    }

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        work_order = self.get_object()
        complete_work_order(work_order)
        return Response(self.get_serializer(work_order).data)


class WorkCenterViewSet(viewsets.ModelViewSet):
    queryset = WorkCenter.objects.all()
    serializer_class = WorkCenterSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["code", "name"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
    }

    def perform_update(self, serializer):
        audit_update(self.get_object(), serializer, "WorkCenter")


class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    serializer_class = OperationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "duration_minutes"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [MANUFACTURING_VIEW],
        "retrieve": [MANUFACTURING_VIEW],
        "create": [MANUFACTURING_CREATE],
        "update": [MANUFACTURING_CREATE],
        "partial_update": [MANUFACTURING_CREATE],
        "destroy": [MANUFACTURING_CREATE],
    }

    def perform_update(self, serializer):
        audit_update(self.get_object(), serializer, "Operation")

