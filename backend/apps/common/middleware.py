import uuid

from apps.common.context import set_request_context


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get("HTTP_X_REQUEST_ID") or uuid.uuid4().hex
        ip_address = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get(
            "REMOTE_ADDR"
        )
        user = getattr(request, "user", None)
        set_request_context(actor=user if getattr(user, "is_authenticated", False) else None, ip_address=ip_address, request_id=request_id)
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response

