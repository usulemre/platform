"""Signal Specifications — composable STRUCTURAL predicates over signals (no algorithm/formula).

These check structural readiness/governance prerequisites (validated, risk-approved, net-of-cost,
evidence present), NOT scores/ranks — those are the deterministic engines' outputs.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TSignal = TypeVar("TSignal", contravariant=True)


class SignalSpecification(Protocol[TSignal]):
    """A composable, deterministic structural predicate over a signal. Interface only."""

    def is_satisfied_by(self, signal: TSignal) -> bool: ...


class ReadyForActivationSpecification(Protocol[TSignal]):
    """Structural readiness for activation (validated, risk-approved, net-of-cost, registered).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, signal: TSignal) -> bool: ...


class GovernanceCompliantSpecification(Protocol[TSignal]):
    """Structural governance compliance (evidence present, isolation-compliant, no overreach). Interface only."""

    def is_satisfied_by(self, signal: TSignal) -> bool: ...
