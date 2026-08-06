"""Portfolio Construction — the construction context and coordination INTERFACE (no math here).

Coordinates deterministic construction of a portfolio candidate from eligible signals subject to
constraints, via the deterministic optimizer. It is reproducible (manifest-referenced, RP-1). No
optimization algorithm or allocation mathematics here.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref, RunManifestRef


@dataclass(frozen=True, slots=True)
class PortfolioConstructionContext:
    """Immutable context for a construction run (reproducibility spine, RP-1).

    ``eligible_signal_refs`` are capital-eligible signals only (PS-1); ``manifest`` binds the run for
    reproducibility; ``as_of`` is a supplied point-in-time boundary for any historical reads (PIT-1).
    """

    eligible_signal_refs: tuple[Ref, ...]
    manifest: RunManifestRef
    as_of: str | None


class PortfolioConstructionService(Protocol):
    """Coordinates deterministic construction of a portfolio candidate. Interface only.

    It consumes only capital-eligible signals (PS-1) and delegates to the deterministic optimizer; it
    never re-adjudicates whether a signal is real and never decides allocation with AI (PS-1, PS-3).
    """

    def construct(self, portfolio: EntityId, context: PortfolioConstructionContext) -> None: ...
