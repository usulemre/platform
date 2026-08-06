"""Dataset Model — the canonical Data Platform models (catalog view; data only).

These compose with the core domain (core_domain.dataset.Dataset is the certified domain aggregate);
here the platform adds catalog/registry attributes. Cross-references are by identity.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Version

from dataset_service.lifecycle import DatasetLifecycle


class SensitivityClass(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    CROWN_JEWEL = "crown_jewel"  # factor/alpha-adjacent data under need-to-know (SEC-2)


class DataClassificationKind(Enum):
    MARKET = "market"
    REFERENCE = "reference"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    DERIVED = "derived"


@dataclass(frozen=True, slots=True)
class DatasetIdentifier:
    """A stable, versioned identity for a dataset (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class DatasetClassification:
    """The kind and sensitivity of a dataset (drives access control, SEC-2)."""

    kind: DataClassificationKind
    sensitivity: SensitivityClass


@dataclass(frozen=True, slots=True)
class DatasetOwnership:
    """The accountable owner and steward roles for a dataset (CP-7, HO-1)."""

    owner_role: str
    steward_role: str


@dataclass(frozen=True, slots=True)
class DatasetStatus:
    """The current lifecycle status of a dataset (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: DatasetLifecycle
    since: str


@dataclass(frozen=True, slots=True)
class DatasetVersion:
    """An immutable, content-addressed dataset version (CP-2)."""

    dataset_id: DatasetIdentifier
    content: ContentAddress
    provenance: Provenance


@dataclass(eq=False)
class Dataset(AggregateRoot):
    """The Data Platform catalog model of a dataset (aggregate root).

    Point-in-time-served, survivorship-safe, provenance-bearing (DI-1, PIT-1/2). It references the
    certified domain aggregate (core_domain.dataset.Dataset) by identity and adds catalog attributes.
    """

    identifier: DatasetIdentifier
    classification: DatasetClassification
    ownership: DatasetOwnership
    status: DatasetStatus
    provenance: Provenance
