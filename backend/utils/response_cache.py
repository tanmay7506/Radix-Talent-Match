"""Small Redis-backed response cache with graceful cache-miss behavior."""

import hashlib
import json
import logging
import os
from typing import Any

from fastapi.encoders import jsonable_encoder
from redis import Redis

logger = logging.getLogger(__name__)

_redis: Redis | None = None
_CACHE_PREFIX = "radix:response:v1"


def _client() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis(
            host="doctor-square-hyperprecise-25731.db.redis.io",
            port=19552,
            decode_responses=True,
            username="default",
            password=os.environ["REDIS_KEY"],
        )
    return _redis


def cache_key(endpoint: str, inputs: Any) -> str:
    """Build a stable key from canonical JSON, including binary input digests."""
    encoded = json.dumps(
        jsonable_encoder(inputs),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    digest = hashlib.sha256(encoded).hexdigest()
    return f"{_CACHE_PREFIX}:{endpoint}:{digest}"


def get_cached(endpoint: str, inputs: Any) -> Any | None:
    try:
        value = _client().get(cache_key(endpoint, inputs))
        print("Cache hit: ", value)
        return json.loads(value) if value is not None else None
    except Exception as error:
        logger.warning("Redis cache read failed: %s", error)
        return None


def set_cached(endpoint: str, inputs: Any, value: Any) -> None:
    try:
        ttl = int(os.getenv("REDIS_CACHE_TTL_SECONDS", "3600"))
        _client().setex(
            cache_key(endpoint, inputs),
            max(ttl, 1),
            json.dumps(jsonable_encoder(value), ensure_ascii=False),
        )
    except Exception as error:
        logger.warning("Redis cache write failed: %s", error)
