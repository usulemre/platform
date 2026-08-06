"""Reproducibility Management — the reproducibility spine INTERFACE for a backtest (no persistence).

Binds the Run Manifest (code hash, dependency lock, container digest, RNG seeds, hardware class,
as-of dataset references, config hash), verifies bit-for-bit reproduction, and enables replay from
the manifest (P1-02, RP-1/2, EX-2). No optimization without reproducibility (RP-2, FB-10).
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId, RunManifestRef


class ReproducibilityManager(Protocol):
    """Manages the reproducibility spine for a backtest. Interface only.

    ``replay`` reproduces a run from its manifest as a new, verifiable run (never mutating the
    original); ``verify_reproducible`` checks bit-for-bit reproduction.
    """

    def bind_manifest(self, backtest: EntityId, manifest: RunManifestRef) -> None: ...
    def replay(self, backtest: EntityId) -> RunManifestRef: ...
    def verify_reproducible(self, backtest: EntityId) -> bool: ...
