"""Research Specifications — composable STRUCTURAL predicates over research (no logic, no statistics).

These check structural readiness (e.g. has a pre-registered hypothesis, declared dependencies), NOT
statistical significance or promotion — those are the deterministic Validation engine's decision.
"""
from __future__ import annotations

from typing import Protocol, TypeVar

TResearch = TypeVar("TResearch", contravariant=True)


class ResearchSpecification(Protocol[TResearch]):
    """A composable, deterministic structural predicate over a research initiative. Interface only."""

    def is_satisfied_by(self, research: TResearch) -> bool: ...


class ReadyForReviewSpecification(Protocol[TResearch]):
    """Structural readiness to submit for review (registered, pre-registered, dependencies declared).

    STRUCTURAL only — it does not judge whether results are significant. Interface only.
    """

    def is_satisfied_by(self, research: TResearch) -> bool: ...


class PromotionPrerequisiteSpecification(Protocol[TResearch]):
    """Structural prerequisites for promotion (has evidence, economic rationale, isolation-compliant).

    The promotion DECISION is the deterministic scientific gate's (P2-09), never this specification.
    Interface only.
    """

    def is_satisfied_by(self, research: TResearch) -> bool: ...
