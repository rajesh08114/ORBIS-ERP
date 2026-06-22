import json
import uuid

from django.core.cache import cache
from django.http import JsonResponse

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


class IdempotencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ["POST", "PUT", "PATCH"]:
            idempotency_key = request.headers.get("Idempotency-Key")
            if idempotency_key:
                cache_key = f"idempotency:{request.path}:{idempotency_key}"
                cached_response = cache.get(cache_key)
                if cached_response:
                    return JsonResponse(
                        cached_response['data'],
                        status=cached_response['status'],
                        headers=cached_response.get('headers', {})
                    )
                
                lock_key = f"lock:{cache_key}"
                acquired = cache.add(lock_key, "1", timeout=60)
                if not acquired:
                    return JsonResponse({"error": "Request already in progress."}, status=409)
                
                try:
                    response = self.get_response(request)
                    if 200 <= response.status_code < 400:
                        if hasattr(response, 'render') and callable(response.render):
                            response.render()
                            
                        try:
                            data = json.loads(response.content.decode('utf-8')) if response.content else {}
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            data = {}
                            
                        cache.set(cache_key, {
                            'status': response.status_code,
                            'data': data,
                            'headers': {k: v for k, v in response.headers.items() if k.lower() != 'set-cookie'}
                        }, timeout=86400)
                        
                    return response
                finally:
                    cache.delete(lock_key)
                    
        return self.get_response(request)

