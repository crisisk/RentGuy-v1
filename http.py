from fastapi import Request
import uuid

def get_correlation_id(request: Request) -> str:
    return request.headers.get("X-Request-ID") or str(uuid.uuid4())
