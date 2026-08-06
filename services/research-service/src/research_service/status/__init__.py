"""Research Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from research_service.lifecycle import ResearchLifecycle


@dataclass(frozen=True, slots=True)
class ResearchStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: ResearchLifecycle
    since: str
