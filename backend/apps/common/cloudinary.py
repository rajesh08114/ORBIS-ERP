from __future__ import annotations

import hashlib
import mimetypes
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.conf import settings


def upload_avatar_to_cloudinary(file_obj, *, folder: str = "mini-erp/avatars") -> dict[str, Any]:
    cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "")
    if not cloud_name:
        raise ValueError("CLOUDINARY_CLOUD_NAME is not configured.")

    upload_preset = getattr(settings, "CLOUDINARY_UPLOAD_PRESET", "")
    api_key = getattr(settings, "CLOUDINARY_API_KEY", "")
    api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "")
    endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    file_name = getattr(file_obj, "name", "avatar")
    content_type = getattr(file_obj, "content_type", None) or mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    payload = file_obj.read()
    fields: dict[str, str] = {"folder": folder}
    if upload_preset:
        fields["upload_preset"] = upload_preset
    elif api_key and api_secret:
        fields["timestamp"] = str(int(time.time()))
        fields["api_key"] = api_key
        fields["signature"] = _sign_request(fields, api_secret)
    else:
        raise ValueError("Configure either CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.")

    body, content_type_header = _encode_multipart(fields, {"file": (file_name, payload, content_type)})
    request = urllib.request.Request(endpoint, data=body, method="POST")
    request.add_header("Content-Type", content_type_header)

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            import json

            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        message = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Cloudinary upload failed with HTTP {exc.code}: {message}") from exc


def delete_cloudinary_asset(public_id: str) -> None:
    cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "")
    api_key = getattr(settings, "CLOUDINARY_API_KEY", "")
    api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "")
    if not (cloud_name and api_key and api_secret and public_id):
        return
    endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"
    fields = {"public_id": public_id, "timestamp": str(int(time.time())), "api_key": api_key}
    fields["signature"] = _sign_request(fields, api_secret)
    body, content_type_header = _encode_multipart(fields, {})
    request = urllib.request.Request(endpoint, data=body, method="POST")
    request.add_header("Content-Type", content_type_header)
    try:
        with urllib.request.urlopen(request, timeout=30):
            return
    except urllib.error.HTTPError:
        return


def _sign_request(fields: dict[str, str], api_secret: str) -> str:
    payload = "&".join(f"{key}={value}" for key, value in sorted(fields.items()) if key != "file")
    digest = hashlib.sha1((payload + api_secret).encode("utf-8")).hexdigest()
    return digest


def _encode_multipart(
    fields: dict[str, str],
    files: dict[str, tuple[str, bytes, str]],
) -> tuple[bytes, str]:
    boundary = f"----mini-erp-{os.urandom(16).hex()}"
    parts: list[bytes] = []
    for key, value in fields.items():
        parts.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{key}"\r\n\r\n'
                f"{value}\r\n"
            ).encode("utf-8")
        )
    for key, (filename, content, content_type) in files.items():
        header = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode("utf-8")
        parts.append(header + content + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"
