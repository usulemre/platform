"""Feature Model — the canonical feature aggregate and value objects (data only).

Reuses the core feature domain (core_domain.feature.FeatureSpec / AcceptanceStatus). A feature is
DECLARATIVE and PIT-bound; this model carries the declaration and references, never the computation.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.feature import AcceptanceStatus, FeatureSpec
from core_domain.shared import AggregateRoot, ContentAddress, Provenance, Ref, Version

from feature_service.classification import FeatureClassification
from feature_service.ownership import FeatureOwner
from feature_service.status import FeatureStatus


@dataclass(frozen=True, slots=True)
class FeatureIdentifier:
    """A stable, versioned identity for a feature (NM-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class FeatureFormulaReference:
    """A reference to the DECLARATIVE feature formula/spec artifact (by content address).

    It references the declarative definition; it is NOT the calculation and holds no logic (FA-1).
    """

    formula: ContentAddress


@dataclass(frozen=True, slots=True)
class FeatureDefinition:
    """The declarative definition of a feature: its spec, formula reference, and dataset inputs.

    Computed only through the as-of path (FA-1, PIT-3); dataset inputs are referenced by identity (SE-2).
    """

    spec: FeatureSpec
    formula: FeatureFormulaReference
    dataset_inputs: tuple[Ref, ...]  # -> dataset_service datasets (by identity)


@dataclass(frozen=True, slots=True)
class FeatureEvidence:
    """Descriptive evidence / economic rationale supporting a feature (not an adjudication)."""

    summary: str
    supports: bool


@dataclass(frozen=True, slots=True)
class FeatureValidationReference:
    """A reference to the feature's leakage/validation report artifact (never the report content).

    Points to the deterministic Leakage Harness / validation result by identity (FA-2, P2-03).
    """

    report: Ref


@dataclass(eq=False)
class Feature(AggregateRoot):
    """A feature (aggregate root): a declarative, PIT-bound, leakage-clean, provenance-bearing,
    versioned artifact.

    It orchestrates and records; it does NOT compute the feature, does NOT run statistics/ML, and does
    NOT adjudicate significance (CP-5, AI-2). Acceptance requires the deterministic Leakage Harness (FA-2).
    """

    identifier: FeatureIdentifier
    definition: FeatureDefinition
    classification: FeatureClassification
    owner: FeatureOwner
    status: FeatureStatus
    acceptance: AcceptanceStatus
    provenance: Provenance
