"""Risk Assessment — the deterministic assessment coordination INTERFACE (no numerical logic)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId


class RiskAssessmentService(Protocol):
    """Coordinates a deterministic risk assessment of a research output. Interface only.

    Independent of research/portfolio (RS-2); the verdict is produced deterministically (RS-1); no AI
    decides (AI-1). It consumes performance evidence from the Backtesting Engine; it computes no
    numerical risk itself (that is the deterministic numerical engine behind the interface).
    """

    def request_assessment(self, subject: EntityId) -> EntityId: ...
    def complete_assessment(self, assessment: EntityId) -> None: ...
