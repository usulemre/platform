"""Canonical ingestion models — raw input, canonical output, quarantine, and result (data only).

A ``RawMarketRecord`` is what the raw vault holds: as-received, vendor-shaped strings plus acquisition
provenance (source, retrieval time, payload hash). Normalization turns it into a ``CanonicalBar`` with
resolved symbology and parsed numerics; the quality gate accepts it or emits a ``QuarantineRecord``
with an explicit reason (DI-2). No logic lives here — only immutable value objects.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum

from core_domain.dataset import DataQualityReport, Dataset
from core_domain.shared import ActorRef, ContentAddress, RunManifestRef, Version
from core_domain.shared.provenance import LineageRef
from platform_storage.as_of_gateway import BitemporalRecord

# --- inputs ----------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RawMarketRecord:
    """One as-received OHLCV bar from the raw vault (DATA-10): vendor strings, never mutated.

    All numeric/time fields are the vendor's raw string form; normalization parses them. ``source``
    and ``payload_hash`` begin the provenance chain at acquisition (DATA-11, DATA-29).
    """

    source: str  # the approved source id (DATA-9)
    payload_hash: str  # content hash of the raw payload in the raw vault (DATA-10)
    symbol: str  # vendor symbol, pre-symbology (e.g. "btcusdt")
    event_time: str  # when the bar occurred (vendor ISO-8601)
    knowledge_time: str  # when the platform could first have known it (DATA-33/34)
    open: str
    high: str
    low: str
    close: str
    volume: str


@dataclass(frozen=True, slots=True)
class IngestionConfig:
    """Deterministic ingestion parameters for one dataset build. All external inputs are supplied."""

    dataset_name: str
    dataset_version: Version
    symbology: Mapping[str, str]  # as-of vendor->canonical symbol map (reference data, PIT-2)
    price_precision: int  # canonical decimal places for prices
    volume_precision: int  # canonical decimal places for volume
    source_trust_tier: str  # trust tier carried onto the dataset (DATA-14)
    produced_by: ActorRef  # the deterministic engine actor (provenance, DATA-29)
    lineage: LineageRef
    run_manifest: RunManifestRef | None = None


# --- canonical output ------------------------------------------------------


@dataclass(frozen=True, slots=True)
class CanonicalBar:
    """A canonical OHLCV bar: resolved symbol, parsed + rounded numerics (DATA-45)."""

    symbol: str  # canonical symbol
    open: float
    high: float
    low: float
    close: float
    volume: float


# --- quarantine ------------------------------------------------------------


class QuarantineReason(Enum):
    """Why a raw record failed the quality gate and was quarantined (DI-2, DATA-21)."""

    MISSING_FIELD = "missing_field"
    UNKNOWN_SYMBOL = "unknown_symbol"  # unresolvable in the as-of symbology (PIT-2)
    UNPARSEABLE_TIMESTAMP = "unparseable_timestamp"  # incl. missing timezone (DATA-33/36)
    UNPARSEABLE_NUMBER = "unparseable_number"
    KNOWLEDGE_BEFORE_EVENT = "knowledge_before_event"  # back-dated knowledge_time (DATA-34)
    NON_POSITIVE_PRICE = "non_positive_price"
    NEGATIVE_VOLUME = "negative_volume"
    OHLC_INCONSISTENT = "ohlc_inconsistent"  # high<low, or high/low not bounding open/close
    DUPLICATE = "duplicate"  # exact same (symbol, event_time, knowledge_time) vintage


@dataclass(frozen=True, slots=True)
class QuarantineRecord:
    """A raw record held out of the canonical dataset with an explicit reason (never dropped, DI-2)."""

    record: RawMarketRecord
    reason: QuarantineReason
    detail: str


# --- result ----------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class IngestionResult:
    """The immutable outcome of one ingestion run (DATA-6 decision record; reproducible, DATA-39)."""

    dataset: Dataset  # certified, content-addressed, provenance-bearing (core domain aggregate)
    content_address: ContentAddress  # SHA-256 over the accepted canonical vintages (DATA-39)
    quality_report: DataQualityReport
    accepted: tuple[BitemporalRecord[CanonicalBar], ...]  # ready for the As-Of Gateway
    quarantined: tuple[QuarantineRecord, ...]


__all__ = [
    "CanonicalBar",
    "IngestionConfig",
    "IngestionResult",
    "QuarantineReason",
    "QuarantineRecord",
    "RawMarketRecord",
]
