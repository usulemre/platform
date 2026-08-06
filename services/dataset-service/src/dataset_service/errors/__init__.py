"""Dataset Errors — Data Platform domain errors (each expresses a violated data invariant)."""
from __future__ import annotations

from core_domain.shared import DomainError


class DatasetError(DomainError):
    """Base for Data Platform errors."""


class DatasetNotRegistered(DatasetError):
    """A dataset was used/served before registration (register-before-use, DP-1)."""


class NonAsOfDatasetRead(DatasetError):
    """A historical dataset read was attempted without an as-of (PIT-1, fail-closed)."""


class ImmutableVersionMutation(DatasetError):
    """An attempt to mutate a published, immutable dataset version (CP-2)."""


class UncertifiedDatasetPublished(DatasetError):
    """An attempt to publish a dataset that has not passed certification (DI-1)."""


class SurvivorshipUnsafe(DatasetError):
    """A dataset/universe was certified or served survivorship-unsafe (FB-7)."""


class LineageDefect(DatasetError):
    """A source defect requires invalidation of downstream datasets (CP-6, DP-2)."""


class DatasetAccessDenied(DatasetError):
    """Access to a dataset was denied by least-privilege/need-to-know policy (SEC-2)."""


class IllegalDatasetTransition(DatasetError):
    """A lifecycle transition not in the canonical set (fail-closed)."""
