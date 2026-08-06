"""Feature Specifications — composable STRUCTURAL predicates over features (no statistics).

These check structural readiness/acceptance prerequisites (declared, provenanced, leakage-report
present), NOT statistical significance — significance/promotion are the deterministic engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TFeature = TypeVar("TFeature", contravariant=True)


class FeatureSpecification(Protocol[TFeature]):
    """A composable, deterministic structural predicate over a feature. Interface only."""

    def is_satisfied_by(self, feature: TFeature) -> bool: ...


class ReadyForValidationSpecification(Protocol[TFeature]):
    """Structural readiness for validation (registered, implemented, declarative definition, provenance).

    STRUCTURAL only. Interface only.
    """

    def is_satisfied_by(self, feature: TFeature) -> bool: ...


class AcceptancePrerequisiteSpecification(Protocol[TFeature]):
    """Structural prerequisites for acceptance (leakage-report present + clean, provenance, versioned).

    The acceptance DECISION is the deterministic Leakage Harness / validation gate's, not this. Interface only.
    """

    def is_satisfied_by(self, feature: TFeature) -> bool: ...
