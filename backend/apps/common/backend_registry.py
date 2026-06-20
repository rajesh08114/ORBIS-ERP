from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Callable

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.forms.models import model_to_dict

from apps.audit.models import AuditEntry, AuditLog
from apps.manufacturing.models import (
    BillOfMaterial,
    BillOfMaterialLine,
    ManufacturingOrder,
    ManufacturingOrderLine,
    Operation,
    WorkCenter,
    WorkOrder,
)
from apps.partners.models import Customer, Vendor
from apps.products.models import Product
from apps.purchases.models import PurchaseOrder, PurchaseOrderLine
from apps.sales.models import SalesOrder, SalesOrderLine
User = get_user_model()


@dataclass(frozen=True)
class ResourceSpec:
    key: str
    label: str
    model: type | None
    queryset_factory: Callable[[], Any] | None
    headers: list[str]
    row_builder: Callable[[Any], dict[str, Any]]
    form_fields: list[str] | None = None
    read_only_fields: list[str] | None = None
    relation_options: dict[str, Callable[[], list[dict[str, Any]]]] | None = None
    custom_form_builder: Callable[[Any], dict[str, Any]] | None = None
    field_visibility: Callable[[Any | None, Any | None], dict[str, bool]] | None = None
    pdf_template: Callable[[list[str], list[dict[str, Any]], str], dict[str, Any]] | None = None


def list_resource_keys() -> list[dict[str, str]]:
    return [{"key": spec.key, "label": spec.label} for spec in RESOURCE_SPECS.values()]


def build_form_metadata(resource: str, instance: Any | None = None, user: Any | None = None) -> dict[str, Any]:
    spec = RESOURCE_SPECS.get(resource)
    if not spec:
        raise KeyError(f"Unsupported resource: {resource}")
    if spec.custom_form_builder:
        metadata = spec.custom_form_builder(instance)
    else:
        if not spec.model:
            raise KeyError(f"Unsupported resource for form metadata: {resource}")
        metadata = _build_model_form_metadata(
            spec.model,
            instance=instance,
            field_names=spec.form_fields,
            read_only_fields=spec.read_only_fields or [],
            relation_options=spec.relation_options or {},
        )
    if spec.field_visibility:
        metadata = _apply_field_visibility(metadata, spec.field_visibility(user, instance))
    return metadata


def build_export_rows(resource: str) -> tuple[list[str], list[dict[str, Any]], str, dict[str, Any] | None]:
    spec = RESOURCE_SPECS.get(resource)
    if not spec or not spec.queryset_factory:
        raise KeyError(f"Unsupported resource: {resource}")
    rows = [spec.row_builder(obj) for obj in spec.queryset_factory()]
    filename = f"{resource.replace('_', '-')}-export"
    template = spec.pdf_template(spec.headers, rows, filename) if spec.pdf_template else None
    return spec.headers, rows, filename, template


def _apply_field_visibility(metadata: dict[str, Any], visibility: dict[str, bool]) -> dict[str, Any]:
    if not visibility:
        return metadata
    updated = dict(metadata)
    updated_fields = []
    for field in metadata.get("fields", []):
        field_copy = dict(field)
        name = field_copy.get("name")
        if name in visibility:
            field_copy["visible"] = visibility[name]
        updated_fields.append(field_copy)
    updated["fields"] = updated_fields
    return updated


def _build_model_form_metadata(
    model: type,
    *,
    instance: Any | None = None,
    field_names: list[str] | None = None,
    read_only_fields: list[str] | None = None,
    relation_options: dict[str, Callable[[], list[dict[str, Any]]]] | None = None,
) -> dict[str, Any]:
    relation_options = relation_options or {}
    read_only_fields = set(read_only_fields or [])
    model_fields = []
    for field in model._meta.get_fields():
        if not getattr(field, "editable", False) and not getattr(field, "many_to_many", False):
            continue
        if getattr(field, "auto_created", False) and not getattr(field, "many_to_many", False):
            continue
        if field.name in {"password", "last_login", "groups", "user_permissions"} and model is User:
            if field.name not in {"groups"}:
                continue
        if field_names and field.name not in field_names:
            continue
        if getattr(field, "many_to_one", False) and getattr(field, "related_model", None) is None:
            continue
        model_fields.append(field)

    fields = []
    initial = model_to_dict(instance) if instance else {}
    for field in model_fields:
        options = []
        if getattr(field, "choices", None):
            options = [{"value": value, "label": label} for value, label in field.choices]
        elif field.name in relation_options:
            options = relation_options[field.name]()
        value = initial.get(field.name)
        fields.append(
            {
                "name": field.name,
                "label": getattr(field, "verbose_name", field.name).replace("_", " ").title(),
                "type": _field_type(field),
                "required": not getattr(field, "blank", False) and not getattr(field, "null", False),
                "read_only": field.name in read_only_fields or not getattr(field, "editable", True),
                "help_text": getattr(field, "help_text", ""),
                "max_length": getattr(field, "max_length", None),
                "choices": options,
                "value": _stringify(value),
            }
        )

    return {
        "resource": getattr(model._meta, "model_name", model.__name__).lower(),
        "model": f"{model._meta.app_label}.{model.__name__}",
        "fields": fields,
        "initial": _serialize_instance(instance) if instance else {},
    }


def _serialize_instance(instance: Any) -> dict[str, Any]:
    if instance is None:
        return {}
    data = model_to_dict(instance)
    for key, value in list(data.items()):
        data[key] = _stringify(value)
    return data


def _safe_related(instance: Any, attr_name: str) -> Any:
    try:
        return getattr(instance, attr_name)
    except Exception:
        return None


def _is_privileged_user(user: Any | None) -> bool:
    return bool(user and (getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)))


def _user_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    privileged = _is_privileged_user(user)
    return {
        "groups": privileged,
        "is_staff": privileged,
        "is_superuser": privileged,
        "avatar_public_id": privileged,
        "role_title": privileged,
    }


def _profile_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    privileged = _is_privileged_user(user)
    return {
        "avatar_public_id": privileged,
    }


def _product_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    privileged = _is_privileged_user(user)
    return {
        "cost_price": privileged,
        "reserved_quantity": privileged,
        "procure_on_demand": privileged,
    }


def _sales_order_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    return {
        "notes": _is_privileged_user(user),
    }


def _purchase_order_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    privileged = _is_privileged_user(user)
    return {
        "trigger_reason": privileged,
        "created_by_system": privileged,
        "notes": privileged,
    }


def _bom_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    return {"notes": _is_privileged_user(user)}


def _manufacturing_order_field_visibility(user: Any | None, _instance: Any | None) -> dict[str, bool]:
    privileged = _is_privileged_user(user)
    return {
        "trigger_reason": privileged,
        "created_by_system": privileged,
        "notes": privileged,
    }


def _pdf_template(title: str, subtitle: str) -> Callable[[list[str], list[dict[str, Any]], str], dict[str, Any]]:
    def _template(headers: list[str], rows: list[dict[str, Any]], filename: str) -> dict[str, Any]:
        return {
            "title": title,
            "subtitle": subtitle,
            "headers": headers,
            "rows": rows,
            "filename": filename,
            "summary_lines": [f"Rows exported: {len(rows)}", f"File: {filename}.pdf"],
        }

    return _template


def _products_pdf_template(headers: list[str], rows: list[dict[str, Any]], filename: str) -> dict[str, Any]:
    return {
        "title": "Products Report",
        "subtitle": "Inventory, procurement, and pricing snapshot",
        "headers": headers,
        "rows": rows,
        "filename": filename,
        "summary_lines": [
            f"Products exported: {len(rows)}",
            f"Visible columns: {', '.join(headers)}",
        ],
    }


def _field_type(field: Any) -> str:
    if getattr(field, "many_to_many", False):
        return "multi_select"
    if getattr(field, "choices", None):
        return "select"
    internal = getattr(field, "get_internal_type", lambda: field.__class__.__name__)()
    mapping = {
        "CharField": "text",
        "TextField": "textarea",
        "EmailField": "email",
        "URLField": "url",
        "BooleanField": "boolean",
        "DecimalField": "decimal",
        "IntegerField": "number",
        "PositiveIntegerField": "number",
        "DateTimeField": "datetime",
        "DateField": "date",
        "ForeignKey": "foreign_key",
    }
    return mapping.get(internal, "text")


def _stringify(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            pass
    if isinstance(value, list):
        return [str(item) for item in value]
    return value


def _group_options() -> list[dict[str, Any]]:
    return [{"value": group.id, "label": group.name} for group in Group.objects.order_by("name")]


def _customer_options() -> list[dict[str, Any]]:
    return [{"value": customer.id, "label": f"{customer.customer_code} - {customer.name}"} for customer in Customer.active.order_by("name")]


def _vendor_options() -> list[dict[str, Any]]:
    return [{"value": vendor.id, "label": f"{vendor.vendor_code} - {vendor.name}"} for vendor in Vendor.active.order_by("name")]


def _product_options() -> list[dict[str, Any]]:
    return [{"value": product.id, "label": f"{product.sku or product.id} - {product.name}"} for product in Product.objects.order_by("name")]


def _bom_options() -> list[dict[str, Any]]:
    return [{"value": bom.id, "label": f"{bom.code} - {bom.finished_product.name}"} for bom in BillOfMaterial.objects.select_related("finished_product").order_by("code")]


def _operation_options() -> list[dict[str, Any]]:
    return [{"value": operation.id, "label": operation.name} for operation in Operation.objects.order_by("name")]


def _work_center_options() -> list[dict[str, Any]]:
    return [{"value": center.id, "label": f"{center.code} - {center.name}"} for center in WorkCenter.objects.order_by("name")]


def _user_options() -> list[dict[str, Any]]:
    return [{"value": user.id, "label": user.get_username()} for user in User.objects.order_by("username")]


def _product_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        Product,
        instance=instance,
        relation_options={"vendor": _vendor_options, "default_bom": _bom_options},
    )


def _sales_order_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        SalesOrder,
        instance=instance,
        relation_options={"customer": _customer_options},
    )


def _sales_order_line_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        SalesOrderLine,
        instance=instance,
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")], "product": _product_options},
    )


def _purchase_order_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        PurchaseOrder,
        instance=instance,
        relation_options={
            "vendor": _vendor_options,
            "source_sales_order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")],
        },
    )


def _purchase_order_line_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        PurchaseOrderLine,
        instance=instance,
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in PurchaseOrder.objects.order_by("-created_at")], "product": _product_options},
    )


def _bom_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        BillOfMaterial,
        instance=instance,
        relation_options={"finished_product": _product_options},
    )


def _bom_line_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        BillOfMaterialLine,
        instance=instance,
        relation_options={"bom": _bom_options, "component": _product_options, "operation": _operation_options},
    )


def _manufacturing_order_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        ManufacturingOrder,
        instance=instance,
        relation_options={
            "bom": _bom_options,
            "finished_product": _product_options,
            "assignee": _user_options,
            "source_sales_order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")],
        },
    )


def _manufacturing_order_line_form(instance: Any | None) -> dict[str, Any]:
    return _build_model_form_metadata(
        ManufacturingOrderLine,
        instance=instance,
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in ManufacturingOrder.objects.order_by("-created_at")], "component": _product_options},
    )


def _user_form(instance: Any | None) -> dict[str, Any]:
    user = instance or User()
    common_profile = _safe_related(user, "erp_profile")
    return {
        "resource": "users",
        "model": f"{User._meta.app_label}.{User.__name__}",
        "fields": [
            {"name": "username", "label": "Username", "type": "text", "required": True, "read_only": False, "choices": [], "value": getattr(user, "username", "")},
            {"name": "email", "label": "Email", "type": "email", "required": False, "read_only": False, "choices": [], "value": getattr(user, "email", "")},
            {"name": "first_name", "label": "First Name", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(user, "first_name", "")},
            {"name": "last_name", "label": "Last Name", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(user, "last_name", "")},
            {"name": "password", "label": "Password", "type": "password", "required": instance is None, "read_only": False, "choices": [], "value": ""},
            {"name": "groups", "label": "Groups", "type": "multi_select", "required": False, "read_only": False, "choices": _group_options(), "value": list(user.groups.values_list("id", flat=True)) if getattr(user, "pk", None) else []},
            {"name": "is_staff", "label": "Is Staff", "type": "boolean", "required": False, "read_only": False, "choices": [], "value": getattr(user, "is_staff", False)},
            {"name": "is_superuser", "label": "Is Superuser", "type": "boolean", "required": False, "read_only": False, "choices": [], "value": getattr(user, "is_superuser", False)},
            {"name": "status", "label": "Status", "type": "select", "required": False, "read_only": False, "choices": [{"value": "active", "label": "Active"}, {"value": "inactive", "label": "Inactive"}], "value": getattr(common_profile, "status", "active")},
            {"name": "role_title", "label": "Role Title", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "role_title", "")},
            {"name": "mobile", "label": "Mobile", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "mobile", "")},
            {"name": "address", "label": "Address", "type": "textarea", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "address", "")},
            {"name": "position", "label": "Position", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "position", "")},
            {"name": "avatar_url", "label": "Avatar URL", "type": "url", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "avatar_url", "")},
            {"name": "avatar_public_id", "label": "Avatar Public ID", "type": "text", "required": False, "read_only": True, "choices": [], "value": getattr(common_profile, "avatar_public_id", "")},
        ],
        "initial": {
            "username": getattr(user, "username", ""),
            "email": getattr(user, "email", ""),
            "first_name": getattr(user, "first_name", ""),
            "last_name": getattr(user, "last_name", ""),
            "groups": list(user.groups.values_list("id", flat=True)) if getattr(user, "pk", None) else [],
            "is_staff": getattr(user, "is_staff", False),
            "is_superuser": getattr(user, "is_superuser", False),
        },
    }


def _profile_form(instance: Any | None) -> dict[str, Any]:
    if instance is not None and getattr(instance, "username", None) is not None:
        user = instance
    elif instance is not None and getattr(instance, "user", None):
        user = instance.user
    else:
        user = User()
    common_profile = _safe_related(user, "erp_profile")
    return {
        "resource": "profiles",
        "model": "unified.profile",
        "fields": [
            {"name": "mobile", "label": "Mobile", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "mobile", "")},
            {"name": "address", "label": "Address", "type": "textarea", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "address", "")},
            {"name": "position", "label": "Position", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "position", "")},
            {"name": "avatar_url", "label": "Avatar URL", "type": "url", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "avatar_url", "")},
            {"name": "status", "label": "Status", "type": "select", "required": False, "read_only": False, "choices": [{"value": "active", "label": "Active"}, {"value": "inactive", "label": "Inactive"}], "value": getattr(common_profile, "status", "active")},
            {"name": "role_title", "label": "Role Title", "type": "text", "required": False, "read_only": False, "choices": [], "value": getattr(common_profile, "role_title", "")},
            {"name": "avatar_public_id", "label": "Avatar Public ID", "type": "text", "required": False, "read_only": True, "choices": [], "value": getattr(common_profile, "avatar_public_id", "")},
        ],
        "initial": {
            "mobile": getattr(common_profile, "mobile", ""),
            "address": getattr(common_profile, "address", ""),
            "position": getattr(common_profile, "position", ""),
            "avatar_url": getattr(common_profile, "avatar_url", ""),
            "status": getattr(common_profile, "status", "active"),
            "role_title": getattr(common_profile, "role_title", ""),
        },
    }


def _audit_log_rows() -> list[dict[str, Any]]:
    return [
        {
            "id": log.id,
            "entity_name": log.entity_name,
            "entity_id": log.entity_id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in AuditLog.objects.order_by("-created_at", "-id")
    ]


def _audit_entry_rows() -> list[dict[str, Any]]:
    return [
        {
            "id": entry.id,
            "actor": entry.actor.username if entry.actor else "",
            "entity_type": entry.entity_type,
            "entity_id": entry.entity_id,
            "action": entry.action,
            "field_name": entry.field_name,
            "old_value": entry.old_value,
            "new_value": entry.new_value,
            "timestamp": entry.timestamp,
            "ip_address": entry.ip_address,
        }
        for entry in AuditEntry.objects.select_related("actor").order_by("-timestamp", "-id")
    ]


def _rowify_qs(queryset, fields: list[str]) -> list[dict[str, Any]]:
    return [{field: getattr(item, field, "") for field in fields} for item in queryset]


RESOURCE_SPECS: dict[str, ResourceSpec] = {
    "products": ResourceSpec(
        key="products",
        label="Products",
        model=Product,
        queryset_factory=lambda: Product.objects.select_related("vendor", "default_bom").order_by("name"),
        headers=["id", "name", "sku", "sales_price", "cost_price", "on_hand_quantity", "reserved_quantity", "procurement_strategy", "procurement_type", "procure_on_demand", "vendor", "default_bom"],
        row_builder=lambda product: {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "sales_price": product.sales_price,
            "cost_price": product.cost_price,
            "on_hand_quantity": product.on_hand_quantity,
            "reserved_quantity": product.reserved_quantity,
            "procurement_strategy": product.procurement_strategy,
            "procurement_type": product.procurement_type,
            "procure_on_demand": product.procure_on_demand,
            "vendor": product.vendor.name if product.vendor else "",
            "default_bom": product.default_bom.code if product.default_bom else "",
        },
        relation_options={"vendor": _vendor_options, "default_bom": _bom_options},
        custom_form_builder=_product_form,
        field_visibility=_product_field_visibility,
        pdf_template=_products_pdf_template,
    ),
    "sales-orders": ResourceSpec(
        key="sales-orders",
        label="Sales Orders",
        model=SalesOrder,
        queryset_factory=lambda: SalesOrder.objects.select_related("customer").prefetch_related("lines").order_by("-created_at"),
        headers=["id", "reference", "customer", "status", "notes", "created_at", "confirmed_at", "delivered_at"],
        row_builder=lambda order: {
            "id": order.id,
            "reference": order.reference,
            "customer": order.customer_name,
            "status": order.status,
            "notes": order.notes,
            "created_at": order.created_at,
            "confirmed_at": order.confirmed_at,
            "delivered_at": order.delivered_at,
        },
        relation_options={"customer": _customer_options},
        custom_form_builder=_sales_order_form,
        field_visibility=_sales_order_field_visibility,
        pdf_template=_pdf_template("Sales Orders Report", "Sales order lifecycle and fulfillment snapshot"),
    ),
    "sales-order-lines": ResourceSpec(
        key="sales-order-lines",
        label="Sales Order Lines",
        model=SalesOrderLine,
        queryset_factory=lambda: SalesOrderLine.objects.select_related("order", "product").order_by("id"),
        headers=["id", "order", "product", "quantity_ordered", "quantity_reserved", "quantity_delivered", "unit_price"],
        row_builder=lambda line: {
            "id": line.id,
            "order": line.order.reference,
            "product": line.product.name,
            "quantity_ordered": line.quantity_ordered,
            "quantity_reserved": line.quantity_reserved,
            "quantity_delivered": line.quantity_delivered,
            "unit_price": line.unit_price,
        },
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")], "product": _product_options},
        custom_form_builder=_sales_order_line_form,
    ),
    "purchase-orders": ResourceSpec(
        key="purchase-orders",
        label="Purchase Orders",
        model=PurchaseOrder,
        queryset_factory=lambda: PurchaseOrder.objects.select_related("vendor", "source_sales_order").order_by("-created_at"),
        headers=["id", "reference", "vendor", "source_sales_order", "trigger_reason", "created_by_system", "status", "notes", "created_at", "confirmed_at", "received_at"],
        row_builder=lambda order: {
            "id": order.id,
            "reference": order.reference,
            "vendor": order.vendor_name,
            "source_sales_order": order.source_sales_order.reference if order.source_sales_order else "",
            "trigger_reason": order.trigger_reason,
            "created_by_system": order.created_by_system,
            "status": order.status,
            "notes": order.notes,
            "created_at": order.created_at,
            "confirmed_at": order.confirmed_at,
            "received_at": order.received_at,
        },
        relation_options={
            "vendor": _vendor_options,
            "source_sales_order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")],
        },
        custom_form_builder=_purchase_order_form,
        field_visibility=_purchase_order_field_visibility,
        pdf_template=_pdf_template("Purchase Orders Report", "Purchase demand and supply snapshot"),
    ),
    "purchase-order-lines": ResourceSpec(
        key="purchase-order-lines",
        label="Purchase Order Lines",
        model=PurchaseOrderLine,
        queryset_factory=lambda: PurchaseOrderLine.objects.select_related("order", "product").order_by("id"),
        headers=["id", "order", "product", "quantity_ordered", "quantity_received", "unit_cost"],
        row_builder=lambda line: {
            "id": line.id,
            "order": line.order.reference,
            "product": line.product.name,
            "quantity_ordered": line.quantity_ordered,
            "quantity_received": line.quantity_received,
            "unit_cost": line.unit_cost,
        },
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in PurchaseOrder.objects.order_by("-created_at")], "product": _product_options},
        custom_form_builder=_purchase_order_line_form,
    ),
    "boms": ResourceSpec(
        key="boms",
        label="Bill of Materials",
        model=BillOfMaterial,
        queryset_factory=lambda: BillOfMaterial.objects.select_related("finished_product").order_by("-created_at"),
        headers=["id", "code", "finished_product", "version", "is_active", "notes", "created_at"],
        row_builder=lambda bom: {
            "id": bom.id,
            "code": bom.code,
            "finished_product": bom.finished_product.name,
            "version": bom.version,
            "is_active": bom.is_active,
            "notes": bom.notes,
            "created_at": bom.created_at,
        },
        relation_options={"finished_product": _product_options},
        custom_form_builder=_bom_form,
        field_visibility=_bom_field_visibility,
        pdf_template=_pdf_template("Bill of Materials Report", "BOM structure and version snapshot"),
    ),
    "bom-lines": ResourceSpec(
        key="bom-lines",
        label="BOM Lines",
        model=BillOfMaterialLine,
        queryset_factory=lambda: BillOfMaterialLine.objects.select_related("bom", "component", "operation").order_by("id"),
        headers=["id", "bom", "component", "quantity_required", "operation", "sequence"],
        row_builder=lambda line: {
            "id": line.id,
            "bom": line.bom.code,
            "component": line.component.name,
            "quantity_required": line.quantity_required,
            "operation": line.operation.name if line.operation else "",
            "sequence": line.sequence,
        },
        relation_options={"bom": _bom_options, "component": _product_options, "operation": _operation_options},
        custom_form_builder=_bom_line_form,
    ),
    "manufacturing-orders": ResourceSpec(
        key="manufacturing-orders",
        label="Manufacturing Orders",
        model=ManufacturingOrder,
        queryset_factory=lambda: ManufacturingOrder.objects.select_related("bom", "finished_product", "assignee").order_by("-created_at"),
        headers=["id", "reference", "bom", "finished_product", "quantity", "assignee", "source_sales_order", "trigger_reason", "created_by_system", "status", "notes", "created_at", "confirmed_at", "completed_at"],
        row_builder=lambda order: {
            "id": order.id,
            "reference": order.reference,
            "bom": order.bom.code if order.bom else "",
            "finished_product": order.finished_product.name if order.finished_product else "",
            "quantity": order.quantity,
            "assignee": order.assignee.username if order.assignee else "",
            "source_sales_order": order.source_sales_order.reference if order.source_sales_order else "",
            "trigger_reason": order.trigger_reason,
            "created_by_system": order.created_by_system,
            "status": order.status,
            "notes": order.notes,
            "created_at": order.created_at,
            "confirmed_at": order.confirmed_at,
            "completed_at": order.completed_at,
        },
        relation_options={
            "bom": _bom_options,
            "finished_product": _product_options,
            "assignee": _user_options,
            "source_sales_order": lambda: [{"value": order.id, "label": order.reference} for order in SalesOrder.objects.order_by("-created_at")],
        },
        custom_form_builder=_manufacturing_order_form,
        field_visibility=_manufacturing_order_field_visibility,
        pdf_template=_pdf_template("Manufacturing Orders Report", "Work execution and production snapshot"),
    ),
    "manufacturing-order-lines": ResourceSpec(
        key="manufacturing-order-lines",
        label="Manufacturing Order Lines",
        model=ManufacturingOrderLine,
        queryset_factory=lambda: ManufacturingOrderLine.objects.select_related("order", "component").order_by("id"),
        headers=["id", "order", "component", "quantity_required", "quantity_reserved", "quantity_consumed"],
        row_builder=lambda line: {
            "id": line.id,
            "order": line.order.reference,
            "component": line.component.name,
            "quantity_required": line.quantity_required,
            "quantity_reserved": line.quantity_reserved,
            "quantity_consumed": line.quantity_consumed,
        },
        relation_options={"order": lambda: [{"value": order.id, "label": order.reference} for order in ManufacturingOrder.objects.order_by("-created_at")], "component": _product_options},
        custom_form_builder=_manufacturing_order_line_form,
    ),
    "users": ResourceSpec(
        key="users",
        label="Users",
        model=User,
        queryset_factory=lambda: User.objects.select_related("erp_profile").prefetch_related("groups").order_by("username"),
        headers=["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser", "is_active", "role_title", "status", "mobile", "address", "position", "avatar_url"],
        row_builder=lambda user: {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "is_active": user.is_active,
            "role_title": getattr(_safe_related(user, "erp_profile"), "role_title", ""),
            "status": getattr(_safe_related(user, "erp_profile"), "status", ""),
            "mobile": getattr(_safe_related(user, "erp_profile"), "mobile", ""),
            "address": getattr(_safe_related(user, "erp_profile"), "address", ""),
            "position": getattr(_safe_related(user, "erp_profile"), "position", ""),
            "avatar_url": getattr(_safe_related(user, "erp_profile"), "avatar_url", ""),
        },
        relation_options={"groups": _group_options},
        custom_form_builder=_user_form,
        field_visibility=_user_field_visibility,
        pdf_template=_pdf_template("Users Report", "User account and access snapshot"),
    ),
    "profiles": ResourceSpec(
        key="profiles",
        label="Unified Profiles",
        model=None,
        queryset_factory=lambda: User.objects.select_related("erp_profile").prefetch_related("groups").order_by("username"),
        headers=["id", "username", "email", "role_title", "mobile", "address", "position", "avatar_url", "status"],
        row_builder=lambda user: {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role_title": getattr(_safe_related(user, "erp_profile"), "role_title", ""),
            "mobile": getattr(_safe_related(user, "erp_profile"), "mobile", ""),
            "address": getattr(_safe_related(user, "erp_profile"), "address", ""),
            "position": getattr(_safe_related(user, "erp_profile"), "position", ""),
            "avatar_url": getattr(_safe_related(user, "erp_profile"), "avatar_url", ""),
            "status": getattr(_safe_related(user, "erp_profile"), "status", ""),
        },
        custom_form_builder=_profile_form,
        field_visibility=_profile_field_visibility,
        pdf_template=_pdf_template("Unified Profiles Report", "Profile and avatar snapshot"),
    ),
    "audit-logs": ResourceSpec(
        key="audit-logs",
        label="Audit Logs",
        model=AuditLog,
        queryset_factory=lambda: AuditLog.objects.order_by("-created_at", "-id"),
        headers=["id", "entity_name", "entity_id", "action", "details", "created_at"],
        row_builder=lambda log: {
            "id": log.id,
            "entity_name": log.entity_name,
            "entity_id": log.entity_id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at,
        },
        pdf_template=_pdf_template("Audit Logs Report", "Historical entity change snapshot"),
    ),
    "audit-entries": ResourceSpec(
        key="audit-entries",
        label="Audit Entries",
        model=AuditEntry,
        queryset_factory=lambda: AuditEntry.objects.select_related("actor").order_by("-timestamp", "-id"),
        headers=["id", "actor", "entity_type", "entity_id", "action", "field_name", "old_value", "new_value", "timestamp", "ip_address"],
        row_builder=lambda entry: {
            "id": entry.id,
            "actor": entry.actor.username if entry.actor else "",
            "entity_type": entry.entity_type,
            "entity_id": entry.entity_id,
            "action": entry.action,
            "field_name": entry.field_name,
            "old_value": entry.old_value,
            "new_value": entry.new_value,
            "timestamp": entry.timestamp,
            "ip_address": entry.ip_address,
        },
        pdf_template=_pdf_template("Audit Entries Report", "Field-level audit trail snapshot"),
    ),
}
