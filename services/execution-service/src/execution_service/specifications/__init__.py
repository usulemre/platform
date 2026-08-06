"""Execution Specifications — composable STRUCTURAL predicates over executions (no routing/math).

These check structural readiness/governance prerequisites (planned, validated, parity-clean,
risk-authorized, token for live), NOT market state — the engine produces plans only.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TExecution = TypeVar("TExecution", contravariant=True)


class ExecutionSpecification(Protocol[TExecution]):
    """A composable, deterministic structural predicate over an execution. Interface only."""

    def is_satisfied_by(self, execution: TExecution) -> bool: ...


class ReadyForAuthorizationSpecification(Protocol[TExecution]):
    """Structural readiness for authorization (planned, validated, parity-clean, risk-authorized).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, execution: TExecution) -> bool: ...


class TokenGatedLiveSpecification(Protocol[TExecution]):
    """Structural check that LIVE holds a valid, time-boxed governance token (RS-4). Interface only."""

    def is_satisfied_by(self, execution: TExecution) -> bool: ...
