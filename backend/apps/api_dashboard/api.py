from __future__ import annotations

import json
from dataclasses import asdict

from django.apps import apps as django_apps
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.api_dashboard.models import DashboardProfile, EndpointSnapshot, TestRun
from apps.api_dashboard.services import (
    EndpointDefinition,
    SanityTestRunner,
    TokenBundle,
    discover_from_openapi,
    discover_target,
    discover_django_router_endpoints,
    export_run_csv,
    export_run_excel,
    export_run_json,
    fetch_json,
    merge_endpoints,
    summarize_schema,
    token_expiration_summary,
)
from apps.common.auth_api import UserSerializer

User = get_user_model()


class DashboardContextMixin:
    permission_classes = [permissions.IsAuthenticated]

    def get_profile(self, request) -> DashboardProfile:
        profile_id = request.data.get("profile_id") or request.query_params.get("profile_id")
        if profile_id:
            return DashboardProfile.objects.get(pk=profile_id)
        profile, _ = DashboardProfile.objects.get_or_create(
            name="local",
            defaults={
                "backend_type": "django",
                "base_url": request.build_absolute_uri("/").rstrip("/"),
                "schema_url": request.build_absolute_uri("/api/schema/?format=json"),
                "created_by": request.user,
            },
        )
        if not profile.base_url:
            profile.base_url = request.build_absolute_uri("/").rstrip("/")
        if not profile.schema_url:
            profile.schema_url = request.build_absolute_uri("/api/schema/?format=json")
        if not profile.created_by:
            profile.created_by = request.user
        profile.save()
        return profile

    def get_endpoints_for_profile(
        self,
        profile: DashboardProfile,
        schema_url: str | None = None,
        backend_type: str | None = None,
    ) -> list[EndpointDefinition]:
        _, resolved_schema_url = discover_target(
            profile.base_url,
            schema_url or profile.schema_url,
            backend_type or profile.backend_type,
        )
        schema = fetch_json(resolved_schema_url)
        endpoints = discover_from_openapi(schema, source="openapi")
        if (backend_type or profile.backend_type) in {"auto", "django"}:
            endpoints = merge_endpoints(endpoints, discover_django_router_endpoints())
        return endpoints


class DashboardSummaryAPIView(DashboardContextMixin, APIView):
    schema = None
    def get(self, request):
        profile = self.get_profile(request)
        discovery_error = None
        try:
            endpoints = self.get_endpoints_for_profile(profile)
        except Exception as exc:
            endpoints = []
            discovery_error = str(exc)
        snapshots = EndpointSnapshot.objects.filter(profile=profile, active=True)
        latest_run = profile.runs.order_by("-created_at").first()
        healthy = snapshots.filter(
            results__run=latest_run,
            results__status="pass",
        ).distinct().count() if latest_run else 0
        failed = snapshots.filter(
            results__run=latest_run,
            results__status="fail",
        ).distinct().count() if latest_run else 0
        skipped = max(0, snapshots.count() - healthy - failed)
        response_times = latest_run.results.aggregate(avg=Avg("response_time_ms")) if latest_run else {"avg": 0}
        slowest = (
            latest_run.results.order_by("-response_time_ms").values("path", "method", "response_time_ms").first()
            if latest_run
            else None
        )
        most_failing = (
            TestRun.objects.filter(profile=profile)
            .values("id")
            .annotate(fails=Count("results", filter=Q(results__status="fail")))
            .order_by("-fails")
            .first()
            if latest_run
            else None
        )
        total_tests = latest_run.total_tests if latest_run else 0
        success_rate = latest_run.success_rate if latest_run else 0
        return Response(
            {
                "profile": {
                    "id": profile.id,
                    "name": profile.name,
                    "base_url": profile.base_url,
                    "schema_url": profile.schema_url,
                    "backend_type": profile.backend_type,
                },
                "metrics": {
                    "total_endpoints": len(endpoints),
                    "healthy_endpoints": healthy,
                    "failed_endpoints": failed,
                    "skipped_endpoints": skipped,
                    "auth_protected_endpoints": sum(1 for endpoint in endpoints if endpoint.auth_required),
                    "average_response_time_ms": round(response_times["avg"] or 0, 2),
                    "success_rate": round(success_rate, 2),
                    "last_test_run": latest_run.finished_at.isoformat() if latest_run and latest_run.finished_at else None,
                    "total_tests": total_tests,
                    "slowest_endpoint": slowest,
                    "most_failing_run_id": most_failing["id"] if most_failing else None,
                },
                "observability": {
                    "total_requests": latest_run.total_tests if latest_run else 0,
                    "failed_requests": latest_run.failed_tests if latest_run else 0,
                    "average_latency_ms": round(response_times["avg"] or 0, 2),
                    "success_percentage": round(success_rate, 2),
                },
                "discovery_error": discovery_error,
            }
        )


class BlueprintAPIView(DashboardContextMixin, APIView):
    schema = None
    def get(self, request):
        return Response(_build_backend_blueprint())


class DiscoveryAPIView(DashboardContextMixin, APIView):
    schema = None
    def post(self, request):
        profile = self.get_profile(request)
        profile.backend_type = request.data.get("backend_type") or profile.backend_type
        profile.base_url = request.data.get("base_url") or profile.base_url
        profile.schema_url = request.data.get("schema_url") or profile.schema_url
        profile.auth_header_prefix = request.data.get("auth_header_prefix") or profile.auth_header_prefix
        profile.extra_headers = request.data.get("extra_headers") or profile.extra_headers or {}
        profile.save()
        try:
            endpoints = self.get_endpoints_for_profile(
                profile,
                schema_url=profile.schema_url,
                backend_type=profile.backend_type,
            )
            schema_url = discover_target(profile.base_url, profile.schema_url, profile.backend_type)[1]
            registry = summarize_schema(fetch_json(schema_url), source="openapi")
        except Exception as exc:
            return Response(
                {
                    "profile": {
                        "id": profile.id,
                        "name": profile.name,
                        "backend_type": profile.backend_type,
                        "base_url": profile.base_url,
                        "schema_url": profile.schema_url,
                    },
                    "error": str(exc),
                    "endpoints": [],
                    "registry": {
                        "source": "openapi",
                        "endpoint_count": 0,
                        "modules": {},
                        "endpoints": [],
                    },
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        payload = {
            "profile": {
                "id": profile.id,
                "name": profile.name,
                "backend_type": profile.backend_type,
                "base_url": profile.base_url,
                "schema_url": profile.schema_url,
            },
            "registry": registry,
            "endpoints": [asdict(endpoint) for endpoint in endpoints],
        }
        return Response(payload)


class RunTestsAPIView(DashboardContextMixin, APIView):
    schema = None
    def post(self, request):
        profile = self.get_profile(request)
        token_bundle = TokenBundle(
            access=request.data.get("access_token", ""),
            refresh=request.data.get("refresh_token", ""),
            auth_header_prefix=request.data.get("auth_header_prefix") or profile.auth_header_prefix,
        )
        try:
            endpoints = self.get_endpoints_for_profile(profile)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        scope = request.data.get("scope", "all")
        module = request.data.get("module")
        endpoint = request.data.get("endpoint")
        failed_from_run_id = request.data.get("failed_from_run_id")

        if scope == "module" and module:
            endpoints = [item for item in endpoints if item.module == module]
        elif scope == "single" and endpoint:
            endpoints = [item for item in endpoints if f"{item.method} {item.path}" == endpoint]
        elif scope == "failed" and failed_from_run_id:
            failed_run = TestRun.objects.get(pk=failed_from_run_id, profile=profile)
            failed_keys = list(
                failed_run.results.filter(status="fail").values_list("path", "method").distinct()
            )
            endpoints = [item for item in endpoints if (item.path, item.method) in set(failed_keys)]

        runner = SanityTestRunner(profile=profile, token_bundle=token_bundle)
        run = runner.run(endpoints, scope=scope, requested_by=request.user)
        return Response(
            {
                "run_id": run.id,
                "status": run.status,
                "progress": run.progress,
                "summary": {
                    "total_endpoints": run.total_endpoints,
                    "total_tests": run.total_tests,
                    "successful_tests": run.successful_tests,
                    "failed_tests": run.failed_tests,
                    "skipped_tests": run.skipped_tests,
                    "average_response_ms": run.average_response_ms,
                    "success_rate": run.success_rate,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class CancelRunAPIView(DashboardContextMixin, APIView):
    schema = None
    def post(self, request, run_id: int):
        profile = self.get_profile(request)
        run = TestRun.objects.get(pk=run_id, profile=profile)
        runner = SanityTestRunner(profile=profile)
        runner.cancel(run)
        return Response({"success": True, "run_id": run.id, "status": run.status})


class RunDetailAPIView(DashboardContextMixin, APIView):
    schema = None
    def get(self, request, run_id: int):
        profile = self.get_profile(request)
        run = TestRun.objects.get(pk=run_id, profile=profile)
        results = list(
            run.results.select_related("endpoint").values(
                "id",
                "path",
                "method",
                "test_type",
                "status",
                "http_status",
                "response_time_ms",
                "request_headers",
                "request_body",
                "response_headers",
                "response_body",
                "error_message",
                "stack_trace",
                "validation_errors",
            )
        )
        return Response(
            {
                "run": {
                    "id": run.id,
                    "status": run.status,
                    "scope": run.scope,
                    "started_at": run.started_at.isoformat() if run.started_at else None,
                    "finished_at": run.finished_at.isoformat() if run.finished_at else None,
                    "progress": run.progress,
                    "total_tests": run.total_tests,
                    "successful_tests": run.successful_tests,
                    "failed_tests": run.failed_tests,
                    "skipped_tests": run.skipped_tests,
                    "average_response_ms": run.average_response_ms,
                    "success_rate": run.success_rate,
                },
                "results": results,
            }
        )


class ExportRunAPIView(DashboardContextMixin, APIView):
    schema = None
    def get(self, request, run_id: int):
        profile = self.get_profile(request)
        run = TestRun.objects.get(pk=run_id, profile=profile)
        export_format = request.query_params.get("format", "json").lower()
        if export_format == "csv":
            content = export_run_csv(run)
            response = HttpResponse(content, content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="api-sanity-run-{run.id}.csv"'
            return response
        if export_format == "xlsx":
            content = export_run_excel(run)
            response = HttpResponse(
                content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="api-sanity-run-{run.id}.xlsx"'
            return response
        response = Response(json.loads(export_run_json(run)))
        response["Content-Disposition"] = f'attachment; filename="api-sanity-run-{run.id}.json"'
        return response


class TokenViewerAPIView(DashboardContextMixin, APIView):
    schema = None
    def post(self, request):
        access = request.data.get("access_token", "")
        refresh = request.data.get("refresh_token", "")
        token_data = {}
        try:
            if access:
                token_data["access"] = token_expiration_summary(access)
            if refresh:
                token_data["refresh"] = token_expiration_summary(refresh)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user if request.user.is_authenticated else None
        return Response(
            {
                "tokens": token_data,
                "user": UserSerializer(user).data if user else None,
                "permissions": list(request.user.get_all_permissions()) if user else [],
                "roles": list(request.user.groups.values_list("name", flat=True)) if user else [],
            }
        )


class EndpointViewerAPIView(DashboardContextMixin, APIView):
    schema = None
    def get(self, request, run_id: int, result_id: int):
        profile = self.get_profile(request)
        run = TestRun.objects.filter(pk=run_id, profile=profile).first()
        if not run:
            return Response({"detail": "Run not found"}, status=status.HTTP_404_NOT_FOUND)
        result_row = run.results.select_related("endpoint").filter(id=result_id).first()
        if not result_row:
            return Response({"detail": "Result not found"}, status=status.HTTP_404_NOT_FOUND)
        entry = result_row.endpoint
        return Response(
            {
                "endpoint": {
                    "path": entry.path if entry else result_row.path,
                    "method": entry.method if entry else result_row.method,
                    "module": entry.module if entry else "",
                    "summary": entry.summary if entry else "",
                    "auth_required": entry.auth_required if entry else False,
                    "tags": entry.tags if entry else [],
                },
                "request": {
                    "headers": result_row.request_headers,
                    "body": result_row.request_body,
                },
                "response": {
                    "headers": result_row.response_headers,
                    "body": result_row.response_body,
                    "http_status": result_row.http_status,
                },
                "error": {
                    "message": result_row.error_message,
                    "stack_trace": result_row.stack_trace,
                    "validation_errors": result_row.validation_errors,
                },
            }
        )


class MeExtendedAPIView(APIView):
    schema = None
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "roles": list(request.user.groups.values_list("name", flat=True)),
                "permissions": list(request.user.get_all_permissions()),
            }
        )


def _build_backend_blueprint() -> dict[str, object]:
    return {
        "database": _build_database_schema(),
        "workflow": _build_workflow_map(),
        "architecture": _build_architecture_map(),
    }


def _build_database_schema() -> dict[str, object]:
    app_groups: dict[str, list[dict[str, object]]] = {}
    for model in django_apps.get_models():
        if model._meta.abstract or model._meta.proxy:
            continue
        fields = []
        relations = []
        for field in model._meta.get_fields():
            if getattr(field, "auto_created", False) and not getattr(field, "concrete", False):
                continue
            field_info = {
                "name": field.name,
                "type": field.__class__.__name__,
                "nullable": bool(getattr(field, "null", False)),
                "blank": bool(getattr(field, "blank", False)),
                "editable": bool(getattr(field, "editable", False)),
            }
            if getattr(field, "max_length", None):
                field_info["max_length"] = field.max_length
            if getattr(field, "choices", None):
                field_info["choices"] = [{"value": value, "label": label} for value, label in field.choices]
            if getattr(field, "is_relation", False):
                related_model = getattr(field, "related_model", None)
                field_info["related_model"] = (
                    f"{related_model._meta.app_label}.{related_model.__name__}"
                    if related_model
                    else ""
                )
                field_info["relation_type"] = (
                    "many_to_many" if getattr(field, "many_to_many", False)
                    else "one_to_many" if getattr(field, "one_to_many", False)
                    else "foreign_key" if getattr(field, "many_to_one", False)
                    else "one_to_one" if getattr(field, "one_to_one", False)
                    else "relation"
                )
                relations.append(field_info)
            else:
                fields.append(field_info)
        app_groups.setdefault(model._meta.app_label, []).append(
            {
                "model": model.__name__,
                "db_table": model._meta.db_table,
                "verbose_name": str(model._meta.verbose_name),
                "fields": fields,
                "relations": relations,
            }
        )

    return {
        "apps": [
            {
                "app_label": app_label,
                "model_count": len(models),
                "models": sorted(models, key=lambda item: item["model"].lower()),
            }
            for app_label, models in sorted(app_groups.items())
        ],
        "total_models": sum(len(models) for models in app_groups.values()),
    }


def _build_workflow_map() -> dict[str, object]:
    return {
        "title": "Backend workflow",
        "steps": [
            {"name": "Authenticate", "details": "JWT login, refresh, and permission checks"},
            {"name": "Discover", "details": "OpenAPI, Swagger JSON, and DRF router introspection"},
            {"name": "Normalize", "details": "Merge and group endpoints by module and auth scope"},
            {"name": "Sanity test", "details": "Connectivity, auth, authorized, validation, and performance checks"},
            {"name": "Score", "details": "Compute health, latency, and success rate"},
            {"name": "Export", "details": "CSV, XLSX, JSON, and PDF reporting"},
        ],
        "data_flow": [
            "Schema source",
            "Endpoint registry",
            "Runner",
            "Results store",
            "Dashboard summary",
            "Exports",
        ],
    }


def _build_architecture_map() -> dict[str, object]:
    routes = []

    def walk(patterns, prefix=""):
        for pattern in patterns:
            if isinstance(pattern, URLResolver):
                walk(pattern.url_patterns, f"{prefix}{pattern.pattern}")
                continue
            if not isinstance(pattern, URLPattern):
                continue
            route = f"{prefix}{pattern.pattern}".replace("^", "").replace("$", "").replace("\\Z", "")
            route = route if route.startswith("/") else f"/{route}"
            routes.append(
                {
                    "name": getattr(pattern, "name", "") or "",
                    "route": route,
                }
            )

    walk(get_resolver().url_patterns)
    return {
        "layers": [
            {"name": "Presentation", "items": ["Dashboard shell", "Token viewer", "Response inspector"]},
            {"name": "API orchestration", "items": ["Discovery", "Sanity runner", "Exports", "Audit views"]},
            {"name": "Domain backend", "items": ["Sales", "Purchases", "Products", "Manufacturing", "Inventory"]},
            {"name": "Data layer", "items": ["Django ORM", "Database tables", "Audit trail"]},
        ],
        "routes": routes[:40],
    }
