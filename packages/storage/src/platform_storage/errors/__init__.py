"""Error Model — the canonical, vendor-neutral storage error model (no vendor details leaked)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class StorageErrorKind(Enum):
    NOT_FOUND = "not_found"
    MUTATION_FORBIDDEN = "mutation_forbidden"      # immutable artifact mutation (CP-2)
    RETENTION_VIOLATION = "retention_violation"    # deleting reproducibility-critical data (RP-4)
    VINTAGE_OVERWRITE = "vintage_overwrite"        # overwriting a vintage (DI-3)
    NON_AS_OF_READ = "non_as_of_read"              # historical read without an as-of (PIT-1)
    INTEGRITY_FAILURE = "integrity_failure"        # content-hash mismatch (reproducibility/tamper)
    VENDOR_LEAK = "vendor_leak"                    # a vendor-specific detail was exposed (AV2-12)
    IRRECOVERABLE = "irrecoverable"                # backup/restore could not recover (P6-03)


@dataclass(frozen=True, slots=True)
class StorageError:
    """A canonical, vendor-neutral storage error (no vendor-specific details leaked, boundary)."""

    kind: StorageErrorKind
    message: str


class StorageFrameworkError(Exception):
    """Base exception for the Storage Layer (framework faults, not vendor errors)."""
