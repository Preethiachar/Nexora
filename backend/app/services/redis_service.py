from typing import Optional, Dict, Any
import json
from app.core.config import settings

# Global in-memory fallback cache dictionary
_in_memory_cache: Dict[str, Any] = {}
_online_users: set = set()

class CacheService:
    def __init__(self):
        self.redis_client = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=1)
            client.ping()
            self.redis_client = client
        except Exception:
            self.redis_client = None

    def set(self, key: str, value: Any, expire_seconds: int = 3600) -> bool:
        val_str = json.dumps(value) if not isinstance(value, str) else value
        if self.redis_client:
            try:
                self.redis_client.setex(key, expire_seconds, val_str)
                return True
            except Exception:
                pass
        _in_memory_cache[key] = val_str
        return True

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val is not None:
                    try:
                        return json.loads(val)
                    except Exception:
                        return val
            except Exception:
                pass
        val = _in_memory_cache.get(key)
        if val is not None:
            try:
                return json.loads(val)
            except Exception:
                return val
        return None

    def set_user_online(self, user_id: int):
        if self.redis_client:
            try:
                self.redis_client.sadd("online_users", str(user_id))
                return
            except Exception:
                pass
        _online_users.add(user_id)

    def set_user_offline(self, user_id: int):
        if self.redis_client:
            try:
                self.redis_client.srem("online_users", str(user_id))
                return
            except Exception:
                pass
        _online_users.discard(user_id)

    def is_user_online(self, user_id: int) -> bool:
        if self.redis_client:
            try:
                return bool(self.redis_client.sismember("online_users", str(user_id)))
            except Exception:
                pass
        return user_id in _online_users

cache_service = CacheService()
