import logging
import os
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routers import products, inventory, sales, categories, settings
from middleware.rate_limit import RateLimitMiddleware
from middleware.logging import StructuredLoggingMiddleware

load_dotenv()

# ─── Structured JSON logging ──────────────────────────────────────────────────
class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "time": self.formatTime(record),
        }
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Talastock API",
    version="1.0.0",
    # Disable docs in production
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url=None,
)

# ─── Middleware (order matters — first added = outermost) ─────────────────────

# 1. Structured logging (outermost — logs everything)
app.add_middleware(StructuredLoggingMiddleware)

# 2. Rate limiting
app.add_middleware(RateLimitMiddleware)

# 3. CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)

# ─── Request body size limit ──────────────────────────────────────────────────
MAX_BODY_SIZE = 1_000_000  # 1MB

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "data": None,
                "message": "Request body too large. Maximum size is 1MB.",
                "error_code": "PAYLOAD_TOO_LARGE",
            },
        )
    return await call_next(request)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(products.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")

# ─── Error handlers ───────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(json.dumps({
        "request_id": request_id,
        "error": str(exc),
        "path": request.url.path,
        "method": request.method,
    }), exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": "An unexpected error occurred",
            "error_code": "INTERNAL_ERROR",
        },
    )

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "env": os.getenv("ENV", "development"),
    }
