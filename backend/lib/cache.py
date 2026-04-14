"""
In-memory cache for Talastock API.
Optionally uses Redis if REDIS_URL is set — falls back to in-memory if not.
"""

import json
import os
import time
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ─── In-memory fallback ───────────────────────────────────────────────────────

_mem_store: dict[str, tuple[Any, float]] = {}


def _mem_get(key: str) -> Any | None:
    entry = _mem_store.get(key)
    if entry is None:
        return None
    data, expires_at = entry
    if time.time() > expires_at:
        del _mem_store[key]
        return None
    return data


def _mem_set(key: str, data: Any, ttl: int) -> None:
    _mem_store[key] = (data, time.time() + ttl)


def _mem_delete(key: str) -> None:
    _mem_store.pop(key, None)


def _mem_delete_pattern(pattern: str) -> None:
    prefix = pattern.rstrip("*")
    keys = [k for k in list(_mem_store.keys()) if k.startswith(prefix)]
    for k in keys:
        del _mem_store[k]


# ─── Redis (optional) ─────────────────────────────────────────────────────────

_redis = None
_redis_checked = False


async def _get_redis():
    global _redis, _redis_checked
    if _redis_checked:
        return _redis
    _redis_checked = True

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        logger.info("REDIS_URL not set — using in-memory cache")
        return None

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(redis_url, decode_responses=True)
        await client.ping()
        _redis = client
        logger.info("Redis connected at %s", redis_url)
    except Exception as e:
        logger.warning("Redis unavailable (%s) — using in-memory cache", e)

    return _redis


# ─── Public API ───────────────────────────────────────────────────────────────

DEFAULT_TTL = 30


async def get_cached(key: str) -> Any | None:
    r = await _get_redis()
    if r:
        try:
            value = await r.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.warning("Cache GET error: %s", e)
    return _mem_get(key)


async def set_cached(key: str, data: Any, ttl: int = DEFAULT_TTL) -> None:
    r = await _get_redis()
    if r:
        try:
            await r.setex(key, ttl, json.dumps(data))
            return
        except Exception as e:
            logger.warning("Cache SET error: %s", e)
    _mem_set(key, data, ttl)


async def invalidate(key: str) -> None:
    r = await _get_redis()
    if r:
        try:
            await r.delete(key)
            return
        except Exception as e:
            logger.warning("Cache DEL error: %s", e)
    _mem_delete(key)


async def invalidate_pattern(pattern: str) -> None:
    r = await _get_redis()
    if r:
        try:
            keys = await r.keys(pattern)
            if keys:
                await r.delete(*keys)
            return
        except Exception as e:
            logger.warning("Cache pattern DEL error: %s", e)
    _mem_delete_pattern(pattern)
