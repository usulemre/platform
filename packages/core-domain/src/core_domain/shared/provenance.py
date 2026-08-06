"""Provenance value objects — every consequential artifact carries its lineage (CP-6, DP-3)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from .authority import ActorRef


@dataclass(frozen=True, slots=True)
class RunManifestRef:
    """Reference to the Run Manifest that reproduces a deterministic artifact (P1-02, RP-1)."""

    id: str


@dataclass(frozen=True, slots=True)
class LineageRef:
    """Reference into the lineage graph back to raw sources (CP-6, DP-1)."""

    id: str


class ArtifactClass(Enum):
    DETERMINISTIC = "deterministic"
    STOCHASTIC = "stochastic"  # any lineage that includes an LLM is reproducible only to output (RP-3)


@dataclass(frozen=True, slots=True)
class Provenance:
    """Mandatory lineage envelope for a consequential artifact (CP-6)."""

    produced_by: ActorRef
    artifact_class: ArtifactClass
    lineage: LineageRef
    run_manifest: RunManifestRef | None
