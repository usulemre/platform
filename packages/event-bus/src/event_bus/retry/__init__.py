"""Retry Policy — reuses the messaging retry policy (declarative values, no timers)."""
from __future__ import annotations

from platform_messaging.retry import BackoffStrategy, RetryPolicy  # reuse

__all__ = ["RetryPolicy", "BackoffStrategy"]
