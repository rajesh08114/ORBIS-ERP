from rest_framework import filters, serializers, viewsets

from apps.common.api import ERPActionPermission
from apps.common.permissions import PRODUCT_CREATE, PRODUCT_DELETE, PRODUCT_EDIT, PRODUCT_VIEW
from apps.manufacturing.models import BillOfMaterial
from apps.partners.models import Vendor
from apps.products.models import Product
from apps.audit.services import log_audit_event, audit_update


class ProductSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.name", read_only=True)
    default_bom_code = serializers.CharField(source="default_bom.code", read_only=True)
    free_to_use_quantity = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "image",
            "sales_price",
            "cost_price",
            "on_hand_quantity",
            "reserved_quantity",
            "free_to_use_quantity",
            "procurement_strategy",
            "procurement_type",
            "procure_on_demand",
            "vendor",
            "vendor_name",
            "default_bom",
            "default_bom_code",
        ]
        read_only_fields = ["id", "free_to_use_quantity", "vendor_name", "default_bom_code"]

    def validate(self, attrs):
        if attrs.get("reserved_quantity", self.instance.reserved_quantity if self.instance else 0) > attrs.get(
            "on_hand_quantity", self.instance.on_hand_quantity if self.instance else 0
        ):
            raise serializers.ValidationError({"reserved_quantity": "Reserved quantity cannot exceed on hand quantity."})
        return attrs


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("vendor", "default_bom")
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "vendor__name"]
    ordering_fields = ["name", "sku", "sales_price", "cost_price", "on_hand_quantity", "reserved_quantity"]
    permission_classes = [ERPActionPermission]
    required_permissions = {
        "list": [PRODUCT_VIEW],
        "retrieve": [PRODUCT_VIEW],
        "create": [PRODUCT_CREATE],
        "update": [PRODUCT_EDIT],
        "partial_update": [PRODUCT_EDIT],
        "destroy": [PRODUCT_DELETE],
    }

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["vendors"] = Vendor.objects.all()
        context["boms"] = BillOfMaterial.objects.all()
        return context

    def perform_create(self, serializer):
        instance = serializer.save()
        log_audit_event(
            entity_name="Product",
            entity_id=str(instance.pk),
            action="created",
            details=serializer.data,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        audit_update(instance, serializer, "Product")

    def perform_destroy(self, instance):
        pk = instance.pk
        name = instance.name
        instance.delete()
        log_audit_event(
            entity_name="Product",
            entity_id=str(pk),
            action="deleted",
            details={"name": name},
        )

