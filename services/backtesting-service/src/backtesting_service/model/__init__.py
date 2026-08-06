"""Backtest Model — the canonical backtest aggregate and value objects (data only).

A backtest is a deterministic, reproducible historical simulation of a subject (feature/signal/
strategy) within an experiment. It references its subject/experiment by identity and binds a Run
Manifest (reproducibility spine). It holds NO simulation algorithm and NO statistics.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import AggregateRoot, Provenance, Ref, RunManifestRef, Version

from backtesting_service.status import BacktestStatus


@dataclass(frozen=True, slots=True)
class BacktestIdentifier:
    """A stable, versioned identity for a backtest (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class BacktestEvidence:
    """Reproducible performance evidence — a reference to the immutable result artifact, not numbers.

    The backtest produces evidence; significance is the deterministic Validation engine's (AI-2, SI-3).
    """

    summary: str
    result_manifest: RunManifestRef


@dataclass(eq=False)
class Backtest(AggregateRoot):
    """A backtest (aggregate root): a deterministic, reproducible historical simulation.

    It is NOT production execution and holds NO simulation algorithm/statistics. It binds a Run
    Manifest (P1-02) so it reproduces bit-for-bit; its result is immutable (BT-3) and never manually
    edited (BT-4).
    """

    identifier: BacktestIdentifier
    experiment: Ref   # -> experiment_service (canonical experiment source)
    subject: Ref      # -> feature/signal/strategy under test (by identity)
    manifest: RunManifestRef
    status: BacktestStatus
    provenance: Provenance
