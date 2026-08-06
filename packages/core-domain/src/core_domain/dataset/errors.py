"""Dataset domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class NonAsOfRead(DomainError):
    """A historical read was attempted without an ``AsOf`` (PIT-1, fail-closed)."""


class VintageOverwrite(DomainError):
    """An attempt to overwrite an existing vintage (DI-3)."""


class UncertifiedDataExposed(DomainError):
    """Uncertified or raw data was exposed to research/AI (DI-1)."""


class SurvivorshipUnsafe(DomainError):
    """A universe/dataset was certified without survivorship safety (FB-7)."""
