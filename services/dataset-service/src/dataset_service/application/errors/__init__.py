"""Dataset Service Errors — application-layer errors of the Dataset Service."""
from __future__ import annotations

from core_domain.shared import DomainError


class DatasetServiceError(DomainError):
    """Base for Dataset Service (application-layer) errors."""


class RegistrationRejected(DatasetServiceError):
    """A registration request was rejected (e.g. duplicate or missing prerequisites, DP-1)."""


class ValidationNotCleared(DatasetServiceError):
    """Publication was attempted before the certification/validation gate passed (DI-1)."""


class VersionPromotionBlocked(DatasetServiceError):
    """A version was promoted before it passed validation (CP-2, VER-2)."""


class DatasetReplacementError(DatasetServiceError):
    """A dataset replacement violated supersede-and-deprecate semantics (CP-2, DEPR-2)."""


class AccessCoordinationDenied(DatasetServiceError):
    """An access-coordination request was denied by least-privilege/need-to-know policy (SEC-2)."""


class IllegalServiceTransition(DatasetServiceError):
    """An operational lifecycle transition not in the canonical set (fail-closed)."""
