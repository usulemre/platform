"""Storage Validation — integrity/reproducibility validation INTERFACES (structural; no statistics)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_storage.core import StorageIdentifier


@dataclass(frozen=True, slots=True)
class StorageIntegrityResult:
    """The immutable outcome of a storage integrity check (content-hash match)."""

    valid: bool
    detail: str


class StorageValidator(Protocol):
    """Verifies stored-item integrity and reproducibility eligibility. Interface only.

    ``verify_integrity`` checks the content-hash matches (tamper-evidence); ``verify_reproducible``
    checks the item reproduces from its manifest (RP-1). Structural only; not statistical.
    """

    def verify_integrity(self, identifier: StorageIdentifier) -> StorageIntegrityResult: ...
    def verify_reproducible(self, identifier: StorageIdentifier) -> bool: ...
