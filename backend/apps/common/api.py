from rest_framework import exceptions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from apps.common.permissions import require_permission


class ERPPageNumberPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


def erp_exception_handler(exc, context):
    if isinstance(exc, exceptions.PermissionDenied):
        return Response(
            {"success": False, "error_code": "FORBIDDEN", "message": "Forbidden"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, exceptions.ValidationError):
        detail = exc.detail
        message = "Validation error"
        if isinstance(detail, dict):
            first_value = next(iter(detail.values()))
            message = first_value[0] if isinstance(first_value, list) else str(first_value)
        elif isinstance(detail, list) and detail:
            message = str(detail[0])
        else:
            message = str(detail)
        return Response(
            {"success": False, "error_code": "VALIDATION_ERROR", "message": message},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, exceptions.NotFound):
        return Response(
            {"success": False, "error_code": "NOT_FOUND", "message": "Not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    from rest_framework.views import exception_handler
    return exception_handler(exc, context)


class ERPActionPermission(BasePermission):
    def has_permission(self, request, view):
        permissions = getattr(view, "required_permissions", None) or {}
        action = getattr(view, "action", None)
        key = action or request.method.lower()
        required = permissions.get(key)
        if not required:
            return True
        for permission in required:
            try:
                require_permission(request.user, permission)
            except Exception as exc:
                raise exceptions.PermissionDenied("Forbidden") from exc
        return True
