"""Policy marker — a named, versioned, deterministic rule set (behavior lives in an engine)."""
from __future__ import annotations

from typing import Protocol


class Policy(Protocol):
    """Marker interface for a deterministic domain policy."""

    ...
