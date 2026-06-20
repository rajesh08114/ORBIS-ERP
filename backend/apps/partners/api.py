from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.api import ERPActionPermission
from apps.common.permissions import CUSTOMER_VIEW, VENDOR_VIEW
from apps.partners.models import Customer, Vendor
from apps.audit.services import log_audit_event, audit_update


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "customer_code",
            "name",
            "email",
            "phone",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "vendor_code",
            "name",
            "email",
            "phone",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    def perform_destroy(self, instance):
        instance.delete()


class CustomerViewSet(SoftDeleteModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["customer_code", "name", "email", "phone"]
    ordering_fields = ["customer_code", "name", "created_at"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [CUSTOMER_VIEW],
        "retrieve": [CUSTOMER_VIEW],
        "create": [CUSTOMER_VIEW],
        "update": [CUSTOMER_VIEW],
        "partial_update": [CUSTOMER_VIEW],
        "destroy": [CUSTOMER_VIEW],
    }

    @action(detail=False, methods=["get"])
    def active(self, request):
        serializer = self.get_serializer(Customer.active.all(), many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_event(
            entity_name="Customer",
            entity_id=str(instance.pk),
            action="created",
            details=serializer.data,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        audit_update(instance, serializer, "Customer")

    def perform_destroy(self, instance):
        pk = instance.pk
        name = instance.name
        instance.delete()
        log_audit_event(
            entity_name="Customer",
            entity_id=str(pk),
            action="deleted",
            details={"name": name},
        )


class VendorViewSet(SoftDeleteModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["vendor_code", "name", "email", "phone"]
    ordering_fields = ["vendor_code", "name", "created_at"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [VENDOR_VIEW],
        "retrieve": [VENDOR_VIEW],
        "create": [VENDOR_VIEW],
        "update": [VENDOR_VIEW],
        "partial_update": [VENDOR_VIEW],
        "destroy": [VENDOR_VIEW],
    }

    @action(detail=False, methods=["get"])
    def active(self, request):
        serializer = self.get_serializer(Vendor.active.all(), many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_event(
            entity_name="Vendor",
            entity_id=str(instance.pk),
            action="created",
            details=serializer.data,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        audit_update(instance, serializer, "Vendor")

    def perform_destroy(self, instance):
        pk = instance.pk
        name = instance.name
        instance.delete()
        log_audit_event(
            entity_name="Vendor",
            entity_id=str(pk),
            action="deleted",
            details={"name": name},
        )
