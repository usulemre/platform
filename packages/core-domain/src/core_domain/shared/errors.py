"""Canonical shared domain errors — each expresses a violated constitutional invariant."""
from __future__ import annotations


class DomainError(Exception):
    """Base for all domain errors. Domain errors express violated invariants, not I/O faults."""


class InvariantViolation(DomainError):
    """A domain aggregate invariant was violated."""


class NotFound(DomainError):
    """A referenced aggregate does not exist."""


class Conflict(DomainError):
    """A concurrency or uniqueness conflict."""


class ImmutabilityViolation(DomainError):
    """An attempt to mutate a consequential, versioned artifact (CP-2)."""


class AuthorityViolation(DomainError):
    """An actor attempted an action beyond its authority ceiling (AI-1..4, HO-1)."""


class SeparationOfPowersViolation(DomainError):
    """A generator tried to adjudicate its own output, or two powers were combined (CP-5)."""


class PointInTimeViolation(DomainError):
    """A read/compute observed information unavailable at the decision moment (PIT-1..4)."""


class IsolationBarrierViolation(DomainError):
    """A generation actor observed validation/OOS outcomes (AD-3, P2-07)."""


class ReproducibilityViolation(DomainError):
    """A deterministic result lacks a manifest or is not reproducible (CP-4, RP-2)."""


class ProvenanceRequired(DomainError):
    """A consequential artifact or memory lacks required lineage (CP-6, DP-3)."""
