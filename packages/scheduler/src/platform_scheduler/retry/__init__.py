"""Retry Policy — retry/backoff as immutable policy data (values, not timers; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class BackoffStrategy(Enum):
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    EXPONENTIAL_JITTER = "exponential_jitter"


@dataclass(frozen=True, slots=True)
class RetryPolicy:
    """Declarative retry configuration for a job. ``base_delay_ms`` is a value; no timer here (CS-3)."""

    max_attempts: int
    backoff: BackoffStrategy
    base_delay_ms: int
