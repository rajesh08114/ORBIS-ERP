from __future__ import annotations

import json
import time
import traceback
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from django.utils import timezone

from apps.api_dashboard.models import DashboardProfile, EndpointSnapshot, TestResult, TestRun
from apps.api_dashboard.services.schema import EndpointDefinition


@dataclass(slots=True)
class TokenBundle:
    access: str = ""
    refresh: str = ""
    auth_header_prefix: str = "Bearer"


class SanityTestRunner:
    def __init__(self, profile: DashboardProfile, token_bundle: TokenBundle | None = None):
        self.profile = profile
        self.token_bundle = token_bundle or TokenBundle(auth_header_prefix=profile.auth_header_prefix)

    def run(
        self,
        endpoints: list[EndpointDefinition],
        scope: str = "all",
        requested_by=None,
        endpoint_filter: list[str] | None = None,
    ) -> TestRun:
        selected = self._filter_endpoints(endpoints, endpoint_filter)
        run = TestRun.objects.create(
            profile=self.profile,
            requested_by=requested_by,
            scope=scope,
            status=TestRun.STATUS_RUNNING,
            total_endpoints=len(selected),
            total_tests=0,
            notes={"endpoint_filter": endpoint_filter or []},
            started_at=timezone.now(),
        )
        try:
            snapshots = self._sync_snapshots(selected)
            total_tests = 0
            successful = 0
            failed = 0
            skipped = 0
            response_times: list[float] = []
            for index, endpoint in enumerate(selected, start=1):
                if self._is_cancelled(run.pk):
                    run.status = TestRun.STATUS_CANCELLED
                    run.cancelled_at = timezone.now()
                    break
                snapshot = snapshots[(endpoint.path, endpoint.method)]
                results = self._run_endpoint(run, snapshot, endpoint)
                for result in results:
                    total_tests += 1
                    if result.status == TestResult.STATUS_PASS:
                        successful += 1
                        if result.response_time_ms:
                            response_times.append(result.response_time_ms)
                    elif result.status == TestResult.STATUS_SKIP:
                        skipped += 1
                    else:
                        failed += 1
                run.progress = int((index / max(1, len(selected))) * 100)
                run.save(update_fields=["progress"])

            if run.status != TestRun.STATUS_CANCELLED:
                run.status = TestRun.STATUS_COMPLETED if failed == 0 else TestRun.STATUS_FAILED
                run.finished_at = timezone.now()
            run.total_tests = total_tests
            run.successful_tests = successful
            run.failed_tests = failed
            run.skipped_tests = skipped
            run.average_response_ms = round(sum(response_times) / len(response_times), 2) if response_times else 0
            run.success_rate = round((successful / total_tests) * 100, 2) if total_tests else 0
            run.save()
            return run
        except Exception:
            run.status = TestRun.STATUS_FAILED
            run.finished_at = timezone.now()
            run.notes = {
                **run.notes,
                "runner_error": traceback.format_exc(),
            }
            run.save()
            raise

    def cancel(self, run: TestRun) -> TestRun:
        run.status = TestRun.STATUS_CANCELLED
        run.cancelled_at = timezone.now()
        run.save(update_fields=["status", "cancelled_at"])
        return run

    def _filter_endpoints(
        self,
        endpoints: list[EndpointDefinition],
        endpoint_filter: list[str] | None,
    ) -> list[EndpointDefinition]:
        if not endpoint_filter:
            return endpoints
        filter_set = set(endpoint_filter)
        return [endpoint for endpoint in endpoints if f"{endpoint.method} {endpoint.path}" in filter_set]

    def _sync_snapshots(self, endpoints: list[EndpointDefinition]) -> dict[tuple[str, str], EndpointSnapshot]:
        snapshots: dict[tuple[str, str], EndpointSnapshot] = {}
        for endpoint in endpoints:
            snapshot, _ = EndpointSnapshot.objects.update_or_create(
                profile=self.profile,
                path=endpoint.path,
                method=endpoint.method,
                defaults={
                    "module": endpoint.module,
                    "tags": endpoint.tags,
                    "summary": endpoint.summary,
                    "operation_id": endpoint.operation_id,
                    "auth_required": endpoint.auth_required,
                    "request_schema": endpoint.request_schema,
                    "response_schema": endpoint.response_schema,
                    "active": True,
                },
            )
            snapshots[(endpoint.path, endpoint.method)] = snapshot
        EndpointSnapshot.objects.filter(profile=self.profile).exclude(
            id__in=[snapshot.id for snapshot in snapshots.values()]
        ).update(active=False)
        return snapshots

    def _run_endpoint(
        self,
        run: TestRun,
        snapshot: EndpointSnapshot,
        endpoint: EndpointDefinition,
    ) -> list[TestResult]:
        results: list[TestResult] = []
        url = self._build_url(endpoint.path)

        results.append(
            self._execute_test(
                run,
                snapshot,
                endpoint,
                "connectivity",
                url,
                {},
                None,
                include_auth_headers=endpoint.auth_required,
            )
        )

        if endpoint.auth_required:
            results.append(
                self._execute_test(
                    run,
                    snapshot,
                    endpoint,
                    "auth",
                    url,
                    {},
                    None,
                    expect_statuses={401, 403},
                    include_auth_headers=False,
                )
            )
            if self._auth_headers():
                results.append(
                    self._execute_test(
                        run,
                        snapshot,
                        endpoint,
                        "authorized",
                        url,
                        {"Accept": "application/json"},
                        self._build_payload(endpoint, valid=True),
                        expect_statuses={200, 201, 204},
                        include_auth_headers=True,
                    )
                )
        else:
            results.append(
                self._execute_test(
                    run,
                    snapshot,
                    endpoint,
                    "authorized",
                    url,
                    {"Accept": "application/json"},
                    self._build_payload(endpoint, valid=True),
                    expect_statuses={200, 201, 204},
                    include_auth_headers=False,
                )
            )

        if endpoint.method in {"POST", "PUT", "PATCH"}:
            results.append(
                self._execute_test(
                    run,
                    snapshot,
                    endpoint,
                    "validation",
                    url,
                    {"Accept": "application/json"},
                    self._build_payload(endpoint, valid=False),
                    expect_statuses={400},
                    include_auth_headers=endpoint.auth_required,
                )
            )

        results.append(
            self._execute_test(
                run,
                snapshot,
                endpoint,
                "performance",
                url,
                {"Accept": "application/json"},
                self._build_payload(endpoint, valid=True),
                expect_statuses={200, 201, 204, 400, 401, 403},
                measure_only=True,
                include_auth_headers=endpoint.auth_required,
            )
        )
        return results

    def _execute_test(
        self,
        run: TestRun,
        snapshot: EndpointSnapshot,
        endpoint: EndpointDefinition,
        test_type: str,
        url: str,
        headers: dict[str, str],
        body: dict[str, Any] | None,
        expect_statuses: set[int] | None = None,
        measure_only: bool = False,
        include_auth_headers: bool = True,
    ) -> TestResult:
        request_headers = self._merge_headers(headers, include_auth=include_auth_headers)
        request_body = body if body is not None else {}
        response_headers: dict[str, Any] = {}
        response_body = ""
        http_status: int | None = None
        error_message = ""
        stack_trace = ""
        response_time = 0.0
        status = TestResult.STATUS_FAIL
        try:
            start = time.perf_counter()
            payload = None
            if body is not None and endpoint.method in {"POST", "PUT", "PATCH", "DELETE"}:
                payload = json.dumps(body).encode("utf-8")
                request_headers.setdefault("Content-Type", "application/json")
            request = urllib.request.Request(
                url,
                data=payload,
                headers=request_headers,
                method=endpoint.method,
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                response_time = (time.perf_counter() - start) * 1000
                http_status = response.status
                response_headers = dict(response.headers.items())
                response_body = response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            response_time = (time.perf_counter() - start) * 1000
            http_status = exc.code
            response_headers = dict(exc.headers.items()) if exc.headers else {}
            response_body = exc.read().decode("utf-8", errors="replace")
            error_message = f"HTTP {exc.code}"
        except Exception as exc:
            response_time = (time.perf_counter() - start) * 1000
            error_message = str(exc)
            stack_trace = traceback.format_exc()

        if http_status is not None and expect_statuses and http_status in expect_statuses:
            status = TestResult.STATUS_PASS
        elif http_status is not None and not expect_statuses:
            status = TestResult.STATUS_PASS
        elif measure_only and http_status is not None:
            status = TestResult.STATUS_PASS

        result = TestResult.objects.create(
            run=run,
            endpoint=snapshot,
            path=endpoint.path,
            method=endpoint.method,
            test_type=test_type,
            status=status,
            http_status=http_status,
            response_time_ms=round(response_time, 2),
            request_headers=request_headers,
            request_body=request_body,
            response_headers=response_headers,
            response_body=response_body[:20000],
            error_message=error_message,
            stack_trace=stack_trace[:20000],
            validation_errors={},
        )
        return result

    def _build_url(self, path: str) -> str:
        import re
        base = self.profile.base_url.rstrip("/")
        normalized = path
        normalized = normalized.replace("{pk}", "1")
        normalized = normalized.replace("{id}", "1")
        normalized = normalized.replace("{slug}", "sample")
        normalized = normalized.replace("<int:pk>", "1")
        normalized = normalized.replace("<str:pk>", "sample")
        normalized = normalized.replace("<uuid:pk>", "00000000-0000-0000-0000-000000000001")
        normalized = re.sub(r"\(\?P<[^>]+>[^)]+\)", "1", normalized)
        normalized = re.sub(r"\\\.\(\?P<format>[^)]+\)/\?", "", normalized)
        return f"{base}{normalized}"

    def _build_payload(self, endpoint: EndpointDefinition, valid: bool = True) -> Any:
        if endpoint.method not in {"POST", "PUT", "PATCH"}:
            return None
        schema = endpoint.request_schema or {}
        payload = self._payload_from_schema(schema)
        if not valid:
            if isinstance(payload, dict) and payload:
                first_key = next(iter(payload))
                payload[first_key] = None
            else:
                payload = {"invalid": None}
        return payload or {}

    def _payload_from_schema(self, schema: dict[str, Any]) -> dict[str, Any]:
        if not schema:
            return {"name": "sample"}
        if "$ref" in schema:
            return {"name": "sample"}
        if schema.get("type") == "array":
            return [self._payload_from_schema(schema.get("items") or {})]
        properties = schema.get("properties") or {}
        required = schema.get("required") or []
        payload: dict[str, Any] = {}
        for key, value in properties.items():
            payload[key] = self._sample_value(value, key in required)
        if not payload:
            payload = {"name": "sample"}
        return payload

    def _sample_value(self, schema: dict[str, Any], required: bool) -> Any:
        schema_type = schema.get("type")
        if "enum" in schema:
            return schema["enum"][0]
        if schema_type == "integer":
            return 1
        if schema_type == "number":
            return 1.0
        if schema_type == "boolean":
            return True
        if schema_type == "array":
            return [self._sample_value(schema.get("items") or {}, required)]
        if schema_type == "object":
            return self._payload_from_schema(schema)
        if "format" in schema and schema["format"] == "date-time":
            return timezone.now().isoformat()
        if "format" in schema and schema["format"] == "date":
            return timezone.now().date().isoformat()
        if required:
            return "sample"
        return schema.get("default", "sample")

    def _merge_headers(self, headers: dict[str, str], include_auth: bool = True) -> dict[str, str]:
        merged = {
            "User-Agent": "MiniERP-SanityDashboard/1.0",
            **{str(key): str(value) for key, value in (self.profile.extra_headers or {}).items()},
            **headers,
        }
        auth_headers = self._auth_headers() if include_auth else {}
        if auth_headers:
            merged.update(auth_headers)
        return merged

    def _auth_headers(self) -> dict[str, str]:
        if not self.token_bundle.access:
            return {}
        prefix = self.token_bundle.auth_header_prefix or "Bearer"
        return {"Authorization": f"{prefix} {self.token_bundle.access}"}

    def _is_cancelled(self, run_id: int) -> bool:
        return TestRun.objects.filter(pk=run_id, status=TestRun.STATUS_CANCELLED).exists()
