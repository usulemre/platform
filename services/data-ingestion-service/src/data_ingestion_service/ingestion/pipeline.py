"""Market-Data Ingestion Pipeline — the deterministic raw -> canonical certification engine.

The first real engine of the data path. It fulfils the intent of
``core_domain.dataset.CertificationService`` deterministically (DI-1, VS-1): raw vault records in,
a certified, content-addressed, provenance-bearing canonical dataset out, with every rejected record
explicitly quarantined.

Enforced by construction:

* **Raw is preserved; canonical is derived (DATA-4/10).** The pipeline never mutates a raw record; it
  emits new canonical vintages and keeps the raw record verbatim inside any quarantine entry.
* **Fail closed to quarantine (DI-2, DATA-21).** A record that violates the contract (missing field,
  unknown symbol, unparseable/back-dated time, non-positive price, inconsistent OHLC, duplicate) is
  quarantined with an explicit reason — never silently repaired or dropped.
* **Bitemporal, no back-dating (DATA-33/34).** Every accepted record carries both event_time and
  knowledge_time; a knowledge_time earlier than its event_time is refused. Times are supplied and
  normalized to UTC — no wall-clock is read (CS-3, DATA-36).
* **Restatements are new vintages (DATA-16/38).** The same (symbol, event_time) at a later
  knowledge_time is a distinct vintage keyed for the As-Of Gateway, not an overwrite; only an *exact*
  (symbol, event_time, knowledge_time) repeat is a duplicate.
* **Content-addressed & reproducible (DATA-39, DE-2).** The dataset id and content address are the
  SHA-256 of the accepted canonical vintages; identical input yields the identical dataset.
"""
from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from core_domain.dataset import CertificationStatus, DataQualityReport, Dataset
from core_domain.shared import (
    BitemporalStamp,
    ContentAddress,
    EntityId,
    EventTime,
    KnowledgeTime,
    Provenance,
    Timestamp,
    VersionedId,
)
from core_domain.shared.provenance import ArtifactClass
from platform_storage.as_of_gateway import BitemporalRecord

from data_ingestion_service.errors import IngestionConfigError
from data_ingestion_service.ingestion.model import (
    CanonicalBar,
    IngestionConfig,
    IngestionResult,
    QuarantineReason,
    QuarantineRecord,
    RawMarketRecord,
)

_PRICE_FIELDS = ("open", "high", "low", "close")


class _Reject(Exception):  # noqa: N818 — internal control-flow signal, not a public error
    """Internal: a record failed a check and must be quarantined with this reason/detail."""

    def __init__(self, reason: QuarantineReason, detail: str) -> None:
        self.reason = reason
        self.detail = detail


class MarketDataIngestionPipeline:
    """The deterministic ingestion + certification engine (DI-1, DI-2)."""

    def ingest(
        self, records: tuple[RawMarketRecord, ...], config: IngestionConfig
    ) -> IngestionResult:
        self._check_config(config)
        accepted: list[BitemporalRecord[CanonicalBar]] = []
        quarantined: list[QuarantineRecord] = []
        seen: set[tuple[str, str]] = set()  # (entity_id, knowledge_time) -> exact-vintage dedup

        for raw in records:
            try:
                record = self._normalize(raw, config, seen)
            except _Reject as rej:
                quarantined.append(QuarantineRecord(record=raw, reason=rej.reason, detail=rej.detail))
                continue
            accepted.append(record)

        content = self._content_address(accepted, config)
        dataset = self._certify(content, config, accepted)
        report = DataQualityReport(
            passed=not quarantined,
            summary=(
                f"source_trust_tier={config.source_trust_tier}; "
                f"accepted={len(accepted)}; quarantined={len(quarantined)}"
            ),
        )
        return IngestionResult(
            dataset=dataset,
            content_address=content,
            quality_report=report,
            accepted=tuple(accepted),
            quarantined=tuple(quarantined),
        )

    # ---- per-record normalization + quality (fail closed) ------------------------------------

    def _normalize(
        self,
        raw: RawMarketRecord,
        config: IngestionConfig,
        seen: set[tuple[str, str]],
    ) -> BitemporalRecord[CanonicalBar]:
        self._require_fields(raw)
        symbol = config.symbology.get(raw.symbol)
        if symbol is None:
            raise _Reject(QuarantineReason.UNKNOWN_SYMBOL, f"symbol {raw.symbol!r} not in symbology")

        event = self._parse_time(raw.event_time)
        knowledge = self._parse_time(raw.knowledge_time)
        if knowledge < event:
            raise _Reject(
                QuarantineReason.KNOWLEDGE_BEFORE_EVENT,
                f"knowledge_time {raw.knowledge_time!r} precedes event_time {raw.event_time!r}",
            )

        prices = {f: self._parse_number(getattr(raw, f)) for f in _PRICE_FIELDS}
        volume = self._parse_number(raw.volume)
        self._check_sanity(prices, volume)

        bar = CanonicalBar(
            symbol=symbol,
            open=round(prices["open"], config.price_precision),
            high=round(prices["high"], config.price_precision),
            low=round(prices["low"], config.price_precision),
            close=round(prices["close"], config.price_precision),
            volume=round(volume, config.volume_precision),
        )
        event_iso = _to_utc_iso(event)
        knowledge_iso = _to_utc_iso(knowledge)
        entity_id = f"{symbol}@{event_iso}"

        key = (entity_id, knowledge_iso)
        if key in seen:
            raise _Reject(
                QuarantineReason.DUPLICATE,
                f"exact vintage {entity_id} @ {knowledge_iso} already ingested this run",
            )
        seen.add(key)

        stamp = BitemporalStamp(
            event_time=EventTime(at=Timestamp(event_iso)),
            knowledge_time=KnowledgeTime(at=Timestamp(knowledge_iso)),
        )
        return BitemporalRecord(entity_id=EntityId(entity_id), value=bar, stamp=stamp)

    @staticmethod
    def _require_fields(raw: RawMarketRecord) -> None:
        for name in ("source", "symbol", "event_time", "knowledge_time", *_PRICE_FIELDS, "volume"):
            if not getattr(raw, name):
                raise _Reject(QuarantineReason.MISSING_FIELD, f"empty required field {name!r}")

    @staticmethod
    def _parse_time(value: str) -> datetime:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise _Reject(QuarantineReason.UNPARSEABLE_TIMESTAMP, f"{value!r}: {exc}") from None
        if dt.tzinfo is None:
            # DATA-33/36: a stamp without a timezone is ambiguous and cannot be trusted.
            raise _Reject(QuarantineReason.UNPARSEABLE_TIMESTAMP, f"{value!r}: missing timezone")
        return dt

    @staticmethod
    def _parse_number(value: str) -> float:
        try:
            return float(value)
        except ValueError:
            raise _Reject(QuarantineReason.UNPARSEABLE_NUMBER, f"{value!r} is not numeric") from None

    @staticmethod
    def _check_sanity(prices: dict[str, float], volume: float) -> None:
        if any(prices[f] <= 0.0 for f in _PRICE_FIELDS):
            raise _Reject(QuarantineReason.NON_POSITIVE_PRICE, f"non-positive price in {prices}")
        if volume < 0.0:
            raise _Reject(QuarantineReason.NEGATIVE_VOLUME, f"negative volume {volume}")
        hi, lo, op, cl = prices["high"], prices["low"], prices["open"], prices["close"]
        if hi < lo or hi < max(op, cl) or lo > min(op, cl):
            raise _Reject(
                QuarantineReason.OHLC_INCONSISTENT,
                f"OHLC not bounded: high={hi} low={lo} open={op} close={cl}",
            )

    # ---- dataset assembly (content-addressed, provenance-bearing) ----------------------------

    @staticmethod
    def _content_address(
        accepted: list[BitemporalRecord[CanonicalBar]], config: IngestionConfig
    ) -> ContentAddress:
        pp, vp = config.price_precision, config.volume_precision
        lines = sorted(
            f"{r.entity_id.value}|{r.stamp.knowledge_time.at.iso8601}|"
            f"{r.value.open:.{pp}f}|{r.value.high:.{pp}f}|{r.value.low:.{pp}f}|"
            f"{r.value.close:.{pp}f}|{r.value.volume:.{vp}f}"
            for r in accepted
        )
        digest = hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()
        return ContentAddress(algorithm="sha256", digest=digest)

    @staticmethod
    def _certify(
        content: ContentAddress,
        config: IngestionConfig,
        accepted: list[BitemporalRecord[CanonicalBar]],
    ) -> Dataset:
        provenance = Provenance(
            produced_by=config.produced_by,
            artifact_class=ArtifactClass.DETERMINISTIC,
            lineage=config.lineage,
            run_manifest=config.run_manifest,
        )
        # A dataset with no clean records cannot be certified; it is quarantined (DI-1).
        certification = (
            CertificationStatus.CERTIFIED if accepted else CertificationStatus.QUARANTINED
        )
        return Dataset(
            id=EntityId(f"DS-{content.digest[:16]}"),
            dataset_id=VersionedId(name=config.dataset_name, version=config.dataset_version),
            certification=certification,
            provenance=provenance,
        )

    @staticmethod
    def _check_config(config: IngestionConfig) -> None:
        if not config.dataset_name:
            raise IngestionConfigError("dataset_name must be non-empty")
        if config.price_precision < 0 or config.volume_precision < 0:
            raise IngestionConfigError("precision must be >= 0")


def _to_utc_iso(dt: datetime) -> str:
    """Normalize a tz-aware instant to a canonical UTC ISO-8601 string (sorts chronologically)."""
    return dt.astimezone(UTC).isoformat()


__all__ = ["MarketDataIngestionPipeline"]
