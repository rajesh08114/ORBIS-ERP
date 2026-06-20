from __future__ import annotations

from collections import Counter

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditEntry, AuditLog
from apps.common.backend_registry import build_export_rows, build_form_metadata, list_resource_keys
from apps.common.cloudinary import upload_avatar_to_cloudinary
from apps.common.profile_services import get_unified_profile, set_avatar, update_unified_profile
from apps.common.reporting import build_csv_bytes, build_pdf_bytes, build_xlsx_bytes
from apps.common.api import ERPActionPermission
from apps.common.permissions import AUDIT_VIEW, DASHBOARD_VIEW

User = get_user_model()


class ResourceIndexAPIView(APIView):
    schema = None
    def get(self, request):
        return Response({"resources": list_resource_keys()})


class EntityFormMetadataAPIView(APIView):
    schema = None
    def get(self, request, resource: str, pk: int | None = None):
        try:
            instance = self._get_instance(resource, pk) if pk is not None else None
            metadata = build_form_metadata(resource, instance=instance, user=request.user)
            return Response(metadata)
        except KeyError:
            return Response({"detail": f"Unsupported resource: {resource}"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def _get_instance(self, resource: str, pk: int):
        if resource == "users":
            return User.objects.select_related("erp_profile").prefetch_related("groups").get(pk=pk)
        if resource == "profiles":
            return User.objects.select_related("erp_profile").prefetch_related("groups").get(pk=pk)
        from apps.common.backend_registry import RESOURCE_SPECS

        spec = RESOURCE_SPECS.get(resource)
        if not spec or not spec.model:
            raise KeyError(resource)
        return spec.model.objects.get(pk=pk)


class EntityExportAPIView(APIView):
    schema = None
    def get(self, request, resource: str):
        try:
            headers, rows, filename, template = build_export_rows(resource)
        except KeyError:
            return Response({"detail": f"Unsupported resource: {resource}"}, status=status.HTTP_404_NOT_FOUND)
        export_format = request.query_params.get("format", "csv").lower()
        if export_format == "pdf":
            template = template or {}
            content = build_pdf_bytes(
                title=template.get("title", f"{resource.replace('-', ' ').title()} Export"),
                headers=headers,
                rows=rows,
                subtitle=template.get("subtitle", "Mini ERP backend export"),
                summary_lines=template.get("summary_lines"),
            )
            response = HttpResponse(content, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
            return response
        if export_format == "xlsx":
            content = build_xlsx_bytes(headers, rows, sheet_name=resource.replace("-", " ").title())
            response = HttpResponse(
                content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
            return response
        if export_format == "json":
            response = Response(rows)
            response["Content-Disposition"] = f'attachment; filename="{filename}.json"'
            return response
        content = build_csv_bytes(headers, rows)
        response = HttpResponse(content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
        return response


class UnifiedProfileAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(get_unified_profile(request.user))

    def patch(self, request):
        return Response(update_unified_profile(request.user, request.data))

    def put(self, request):
        return self.patch(request)


class UnifiedAvatarUploadAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        avatar_file = request.FILES.get("avatar") or request.FILES.get("file")
        if avatar_file is None:
            return Response({"detail": "An avatar file is required."}, status=status.HTTP_400_BAD_REQUEST)
        uploaded = upload_avatar_to_cloudinary(avatar_file, folder=f"mini-erp/avatars/{request.user.id}")
        profile = set_avatar(
            request.user,
            avatar_url=uploaded.get("secure_url", ""),
            avatar_public_id=uploaded.get("public_id", ""),
        )
        return Response({"success": True, "upload": uploaded, "profile": profile}, status=status.HTTP_201_CREATED)


class AuditSummaryAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated, ERPActionPermission]
    required_permissions = {"get": [AUDIT_VIEW]}

    def get(self, request):
        logs = AuditLog.objects.all()
        entries = AuditEntry.objects.select_related("actor").all()
        recent_logs = list(logs.order_by("-created_at", "-id")[:20].values())
        recent_entries = list(entries.order_by("-timestamp", "-id")[:20].values())
        by_action = {row["action"]: row["total"] for row in entries.values("action").annotate(total=Count("id"))}
        by_entity = {row["entity_name"]: row["total"] for row in logs.values("entity_name").annotate(total=Count("id"))}
        timeline = _build_timeline(entries)
        return Response(
            {
                "totals": {
                    "audit_logs": logs.count(),
                    "audit_entries": entries.count(),
                    "unique_entities": logs.values("entity_name").distinct().count(),
                    "unique_actions": entries.values("action").distinct().count(),
                },
                "by_action": by_action,
                "by_entity": by_entity,
                "timeline": timeline,
                "recent_logs": recent_logs,
                "recent_entries": recent_entries,
            }
        )


class AuditEntityAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated, ERPActionPermission]
    required_permissions = {"get": [AUDIT_VIEW]}

    def get(self, request, entity_name: str, entity_id: str):
        logs = AuditLog.objects.filter(entity_name=entity_name, entity_id=str(entity_id)).order_by("-created_at", "-id")
        entries = AuditEntry.objects.filter(entity_type=entity_name, entity_id=str(entity_id)).select_related("actor").order_by("-timestamp", "-id")
        return Response(
            {
                "entity_name": entity_name,
                "entity_id": entity_id,
                "log_count": logs.count(),
                "entry_count": entries.count(),
                "logs": list(logs.values()),
                "entries": list(entries.values()),
            }
        )


class AuditExportAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated, ERPActionPermission]
    required_permissions = {"get": [AUDIT_VIEW]}

    def get(self, request):
        export_type = request.query_params.get("type", "logs")
        format_name = request.query_params.get("format", "csv").lower()
        if export_type == "entries":
            headers = ["id", "actor", "entity_type", "entity_id", "action", "field_name", "old_value", "new_value", "timestamp", "ip_address"]
            rows = [
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
            filename = "audit-entries"
        else:
            headers = ["id", "entity_name", "entity_id", "action", "details", "created_at"]
            rows = [
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
            filename = "audit-logs"

        if format_name == "pdf":
            content = build_pdf_bytes(
                f"{filename.replace('-', ' ').title()} Export",
                headers,
                rows,
                subtitle="Audit trail export",
                summary_lines=[f"Rows exported: {len(rows)}"],
            )
            response = HttpResponse(content, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
            return response
        if format_name == "xlsx":
            content = build_xlsx_bytes(headers, rows, sheet_name=filename.replace("-", " ").title())
            response = HttpResponse(
                content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
            return response
        content = build_csv_bytes(headers, rows)
        response = HttpResponse(content, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
        return response


def _build_timeline(entries):
    buckets = Counter(entry.timestamp.date().isoformat() for entry in entries)
    return [{"date": date, "count": count} for date, count in sorted(buckets.items())]
