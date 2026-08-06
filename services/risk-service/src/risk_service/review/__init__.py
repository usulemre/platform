"""Risk Review — the independent (2nd-line) risk review INTERFACE and governed exception handling."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskReviewService(Protocol):
    """Independent risk review of a deterministic assessment (RS-2, 2nd line). Interface only.

    It is independent of research/portfolio; it handles governed exceptions with recorded rationale
    (HO-2); an exception MUST NOT bypass a hard risk control (HO-3).
    """

    def review(self, assessment: EntityId) -> None: ...
    def request_exception(self, assessment: EntityId, rationale: str) -> None: ...
