import time
from collections import defaultdict, deque
from threading import Lock


class RateLimitExceeded(Exception):
    """Raised when a per-email window has been exhausted."""


class EmailRateLimiter:
    """In-process sliding-window rate limiter, keyed by email.

    Use one instance per process. State lost on restart (acceptable for MVP).
    """

    def __init__(self, max_per_window: int, window_seconds: int):
        self.max = max_per_window
        self.window = window_seconds
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check_and_record(self, email: str) -> None:
        now = time.monotonic()
        cutoff = now - self.window
        key = email.lower().strip()
        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max:
                raise RateLimitExceeded(
                    f"max {self.max} per {self.window}s exceeded"
                )
            bucket.append(now)
