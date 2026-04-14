"""
Structured JSON request logging middleware.
Logs every request with timing, status, and correlation ID.
"""

import time
import uuid
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("talastock.access")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.time()

        # Add request ID to state for use in route handlers
        request.state.request_id = request_id

        response = await call_next(request)

        duration_ms = round((time.time() - start) * 1000, 2)

        # Skip logging for static assets
        if not request.url.path.startswith("/_next"):
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "ip": request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown"),
            }

            level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(level, json.dumps(log_data))

        return response
