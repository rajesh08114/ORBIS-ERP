from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from dataclasses import asdict
from typing import Any

from django.conf import settings
from django.urls import URLPattern, URLResolver, get_resolver


@dataclass(slots=True)
class EndpointDefinition:
    path: str
    method: str
    module: str = ""
    tags: list[str] = field(default_factory=list)
    summary: str = ""
    operation_id: str = ""
    auth_required: bool = False
    request_schema: dict[str, Any] = field(default_factory=dict)
    response_schema: dict[str, Any] = field(default_factory=dict)
    source: str = "schema"


def fetch_json(url: str, headers: dict[str, str] | None = None, timeout: int = 15) -> dict[str, Any]:
    request = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        raise RuntimeError(f"Unable to fetch schema from {url}: {exc.code}") from exc
    try:
        return json.loads(payload)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Schema at {url} is not valid JSON") from exc


def guess_schema_url(base_url: str, backend_type: str) -> str:
    base = base_url.rstrip("/")
    if backend_type == "fastapi":
        return f"{base}/openapi.json"
    return f"{base}/api/schema/?format=json"


def discover_from_openapi(schema: dict[str, Any], source: str = "schema") -> list[EndpointDefinition]:
    paths = schema.get("paths") or {}
    security_schemes = (schema.get("components") or {}).get("securitySchemes") or {}
    global_security = schema.get("security") or []
    endpoints: list[EndpointDefinition] = []

    for path, operations in paths.items():
        for method, details in operations.items():
            method_upper = method.upper()
            if method_upper not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
                continue

            if not isinstance(details, dict):
                continue

            security = details.get("security")
            auth_required = bool(
                security
                if security is not None
                else global_security
            )
            if not security and not global_security and security_schemes:
                auth_required = False

            request_schema = _extract_request_schema(details)
            response_schema = _extract_response_schema(details)
            tags = list(details.get("tags") or [])
            endpoints.append(
                EndpointDefinition(
                    path=path,
                    method=method_upper,
                    module=_module_from_tags(tags, path),
                    tags=tags,
                    summary=str(details.get("summary") or details.get("description") or ""),
                    operation_id=str(details.get("operationId") or ""),
                    auth_required=auth_required,
                    request_schema=request_schema,
                    response_schema=response_schema,
                    source=source,
                )
            )

    return endpoints


def discover_django_router_endpoints() -> list[EndpointDefinition]:
    resolver = get_resolver()
    endpoints: list[EndpointDefinition] = []

    def walk(patterns: list[Any], prefix: str = "") -> None:
        for pattern in patterns:
            if isinstance(pattern, URLResolver):
                walk(pattern.url_patterns, f"{prefix}{pattern.pattern}")
                continue
            if not isinstance(pattern, URLPattern):
                continue
            callback = getattr(pattern, "callback", None)
            actions = getattr(callback, "actions", None)
            if not actions:
                continue
            route = f"{prefix}{pattern.pattern}"
            route = route.replace("^", "").replace("$", "")
            route = route.replace("\\Z", "")
            for method, action in actions.items():
                endpoints.append(
                    EndpointDefinition(
                        path=_normalize_route(route),
                        method=method.upper(),
                        module=_module_from_callback(callback),
                        tags=[_module_from_callback(callback)],
                        summary=getattr(callback, "cls", None).__name__ if getattr(callback, "cls", None) else "",
                        operation_id=f"{_module_from_callback(callback)}.{action}",
                        auth_required=True,
                        source="router",
                    )
                )

    walk(resolver.url_patterns)
    return endpoints


def discover_target(base_url: str | None = None, schema_url: str | None = None, backend_type: str = "auto") -> tuple[str, str]:
    root = (base_url or getattr(settings, "SITE_BASE_URL", "") or "http://127.0.0.1:8000").rstrip("/")
    if schema_url:
        return root, schema_url
    resolved_backend = backend_type if backend_type != "auto" else "django"
    return root, guess_schema_url(root, resolved_backend)


def merge_endpoints(*collections: list[EndpointDefinition]) -> list[EndpointDefinition]:
    merged: dict[tuple[str, str], EndpointDefinition] = {}
    for collection in collections:
        for endpoint in collection:
            key = (endpoint.path, endpoint.method)
            existing = merged.get(key)
            if existing is None:
                merged[key] = endpoint
                continue
            existing.tags = sorted(set(existing.tags + endpoint.tags))
            if not existing.summary and endpoint.summary:
                existing.summary = endpoint.summary
            if not existing.operation_id and endpoint.operation_id:
                existing.operation_id = endpoint.operation_id
            existing.auth_required = existing.auth_required or endpoint.auth_required
            if not existing.request_schema and endpoint.request_schema:
                existing.request_schema = endpoint.request_schema
            if not existing.response_schema and endpoint.response_schema:
                existing.response_schema = endpoint.response_schema
            if existing.module == "api" and endpoint.module:
                existing.module = endpoint.module
    return sorted(merged.values(), key=lambda item: (item.module, item.path, item.method))


def summarize_schema(schema: dict[str, Any], source: str = "schema") -> dict[str, Any]:
    endpoints = discover_from_openapi(schema, source=source)
    grouped = {}
    for endpoint in endpoints:
        grouped.setdefault(endpoint.module or "api", []).append(endpoint)
    return {
        "source": source,
        "endpoint_count": len(endpoints),
        "modules": {key: len(value) for key, value in grouped.items()},
        "endpoints": [asdict(endpoint) for endpoint in endpoints],
    }


def _extract_request_schema(details: dict[str, Any]) -> dict[str, Any]:
    request_body = details.get("requestBody") or {}
    content = request_body.get("content") or {}
    json_content = content.get("application/json") or {}
    return json_content.get("schema") or {}


def _extract_response_schema(details: dict[str, Any]) -> dict[str, Any]:
    responses = details.get("responses") or {}
    for status_code in ("200", "201", "202", "204"):
        response = responses.get(status_code) or {}
        content = response.get("content") or {}
        json_content = content.get("application/json") or {}
        schema = json_content.get("schema")
        if schema:
            return schema
    return {}


def _normalize_route(route: str) -> str:
    route = route.replace("<drf_format_suffix:format>", "")
    route = route.replace("<str:pk>", "{pk}")
    route = route.replace("<int:pk>", "{pk}")
    route = route.replace("<uuid:pk>", "{pk}")
    route = route.replace("<slug:slug>", "{slug}")
    if not route.startswith("/"):
        route = f"/{route}"
    return route


def _module_from_tags(tags: list[str], path: str) -> str:
    if tags:
        return tags[0]
    cleaned = path.strip("/").split("/")
    return cleaned[0] if cleaned and cleaned[0] else "api"


def _module_from_callback(callback: Any) -> str:
    cls = getattr(callback, "cls", None)
    module = getattr(cls, "__module__", "") or getattr(callback, "__module__", "")
    parts = module.split(".")
    for part in parts:
        if part and part not in {"api", "views", "viewsets"}:
            return part
    return parts[-1] if parts else "api"
