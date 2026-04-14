"""
Per-IP rate limiting middleware for FastAPI.
Protects all API endpoints from abuse.
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Rate limit config per endpoint type
LIMITS = {
    "default":  {"max": 100, "window": 60},   # 100 req/min general
    "write":    {"max": 30,  "window": 60},   # 30 writes/min
    "ai":       {"max": 10,  "window": 60},   # 10 AI calls/min
}

# Write endpoints that need stricter limits
WRITE_PATHS = {"/products", "/inventory", "/sales", "/categories"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._store: dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": 0})

    def _get_limit_type(self, path: str, method: str) -> str:
        if method in ("POST", "PUT", "DELETE", "PATCH"):
            for write_path in WRITE_PATHS:
                if write_path in path:
                    return "write"
        return "default"

    def _check_limit(self, key: str, limit_type: str) -> tuple[bool, int]:
        limit = LIMITS[limit_type]
        now = time.time()
        entry = self._store[key]

        if now > entry["reset_at"]:
            entry["count"] = 1
            entry["reset_at"] = now + limit["window"]
            return True, 0

        if entry["count"] >= limit["max"]:
            retry_after = int(entry["reset_at"] - now)
            return False, retry_after

        entry["count"] += 1
        return True, 0

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else (
            request.client.host if request.client else "unknown"
        )

        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        limit_type = self._get_limit_type(request.url.path, request.method)
        key = f"{limit_type}:{ip}"

        allowed, retry_after = self._check_limit(key, limit_type)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "data": None,
                    "message": f"Too many requests. Try again in {retry_after} seconds.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                },
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        return response
