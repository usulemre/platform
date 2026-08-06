"""Risk Specifications — composable STRUCTURAL predicates over risk assessments (no numerical logic).

These check structural governance prerequisites (has evidence, profile, independent owner), NOT
numerical risk levels — those are the deterministic engine's evaluation.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TRisk = TypeVar("TRisk", contravariant=True)


class RiskSpecification(Protocol[TRisk]):
    """A composable, deterministic structural predicate over a risk assessment. Interface only."""

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...


class WithinGovernanceSpecification(Protocol[TRisk]):
    """Structural governance readiness (has evidence, profile, independent owner). Interface only."""

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...


class PromotionEligibilitySpecification(Protocol[TRisk]):
    """Structural prerequisites for promotion to signal generation (assessed, validated, reviewed,
    approved). The promotion DECISION is the deterministic gate + independent sign-off, not this. Interface only.
    """

    def is_satisfied_by(self, assessment: TRisk) -> bool: ...
