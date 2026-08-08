"""Golden-set tests for the Market-Data Ingestion Pipeline (VS-1, CS-2, DI-1/2, DATA-*).

Each test pins one guarantee of raw -> canonical certification: normalization correctness, a
fail-closed quarantine for every fault class, restatement-vs-duplicate, and reproducibility.
"""
from __future__ import annotations

import pytest
from core_domain.dataset import CertificationStatus
from core_domain.shared import ActorKind, ActorRef, Authority, Version
from core_domain.shared.provenance import LineageRef
from data_ingestion_service.errors import IngestionConfigError
from data_ingestion_service.ingestion import (
    IngestionConfig,
    MarketDataIngestionPipeline,
    QuarantineReason,
    RawMarketRecord,
)

ENGINE = ActorRef(id="engine:ingest", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)


def _config(**kw: object) -> IngestionConfig:
    base: dict[str, object] = dict(
        dataset_name="binance.spot.klines",
        dataset_version=Version(1, 0, 0),
        symbology={"btcusdt": "BTC/USDT", "ethusdt": "ETH/USDT"},
        price_precision=2,
        volume_precision=4,
        source_trust_tier="T1",
        produced_by=ENGINE,
        lineage=LineageRef(id="LIN-1"),
    )
    base.update(kw)
    return IngestionConfig(**base)  # type: ignore[arg-type]


def _raw(**kw: object) -> RawMarketRecord:
    base: dict[str, object] = dict(
        source="binance",
        payload_hash="ph1",
        symbol="btcusdt",
        event_time="2026-01-01T00:00:00Z",
        knowledge_time="2026-01-01T00:00:05Z",
        open="100.0",
        high="110.0",
        low="90.0",
        close="105.0",
        volume="12.5",
    )
    base.update(kw)
    return RawMarketRecord(**base)  # type: ignore[arg-type]


def _ingest(*records: RawMarketRecord, config: IngestionConfig | None = None):  # type: ignore[no-untyped-def]
    return MarketDataIngestionPipeline().ingest(tuple(records), config or _config())


def _only_reason(result) -> QuarantineReason:  # type: ignore[no-untyped-def]
    assert len(result.quarantined) == 1, result.quarantined
    return result.quarantined[0].reason


# --- normalization (happy path) ---------------------------------------------


def test_clean_record_is_normalized_and_certified() -> None:
    result = _ingest(_raw())
    assert result.quarantined == ()
    assert result.dataset.certification is CertificationStatus.CERTIFIED
    assert result.quality_report.passed is True
    (rec,) = result.accepted
    assert rec.value.symbol == "BTC/USDT"  # symbology resolved (PIT-2)
    assert rec.value.close == 105.0
    assert rec.entity_id.value == "BTC/USDT@2026-01-01T00:00:00+00:00"
    # bitemporal stamp normalized to UTC
    assert rec.stamp.knowledge_time.at.iso8601 == "2026-01-01T00:00:05+00:00"


def test_precision_rounding_is_applied() -> None:
    result = _ingest(_raw(close="105.128", volume="1.23456"))
    (rec,) = result.accepted
    assert rec.value.close == 105.13  # price_precision=2
    assert rec.value.volume == 1.2346  # volume_precision=4


def test_raw_record_preserved_in_quarantine() -> None:
    """DATA-4: the raw record is kept verbatim, never mutated."""
    bad = _raw(close="-1")
    result = _ingest(bad)
    assert result.quarantined[0].record is bad


# --- fail-closed quarantine, one per fault class ----------------------------


def test_missing_field_quarantined() -> None:
    assert _only_reason(_ingest(_raw(close=""))) is QuarantineReason.MISSING_FIELD


def test_unknown_symbol_quarantined() -> None:
    assert _only_reason(_ingest(_raw(symbol="dogeusdt"))) is QuarantineReason.UNKNOWN_SYMBOL


def test_unparseable_timestamp_quarantined() -> None:
    assert _only_reason(_ingest(_raw(event_time="not-a-time"))) is QuarantineReason.UNPARSEABLE_TIMESTAMP


def test_missing_timezone_quarantined() -> None:
    """DATA-33/36: a naive timestamp is ambiguous and refused."""
    assert _only_reason(_ingest(_raw(knowledge_time="2026-01-01T00:00:05"))) is QuarantineReason.UNPARSEABLE_TIMESTAMP


def test_unparseable_number_quarantined() -> None:
    assert _only_reason(_ingest(_raw(high="abc"))) is QuarantineReason.UNPARSEABLE_NUMBER


def test_knowledge_before_event_quarantined() -> None:
    """DATA-34: back-dated knowledge_time injects look-ahead and is refused."""
    r = _raw(event_time="2026-01-01T00:00:10Z", knowledge_time="2026-01-01T00:00:00Z")
    assert _only_reason(_ingest(r)) is QuarantineReason.KNOWLEDGE_BEFORE_EVENT


def test_non_positive_price_quarantined() -> None:
    assert _only_reason(_ingest(_raw(low="0"))) is QuarantineReason.NON_POSITIVE_PRICE


def test_negative_volume_quarantined() -> None:
    assert _only_reason(_ingest(_raw(volume="-5"))) is QuarantineReason.NEGATIVE_VOLUME


def test_ohlc_inconsistent_quarantined() -> None:
    assert _only_reason(_ingest(_raw(high="80", low="90"))) is QuarantineReason.OHLC_INCONSISTENT


def test_high_below_close_quarantined() -> None:
    assert _only_reason(_ingest(_raw(high="104", close="105"))) is QuarantineReason.OHLC_INCONSISTENT


# --- duplicate vs restatement -----------------------------------------------


def test_exact_duplicate_vintage_quarantined() -> None:
    """The same (symbol, event_time, knowledge_time) twice is a duplicate."""
    result = _ingest(_raw(), _raw())
    assert len(result.accepted) == 1
    assert _only_reason_is_dup(result)


def _only_reason_is_dup(result) -> bool:  # type: ignore[no-untyped-def]
    assert [q.reason for q in result.quarantined] == [QuarantineReason.DUPLICATE]
    return True


def test_restatement_is_accepted_as_new_vintage() -> None:
    """DATA-16/38: same bar at a LATER knowledge_time is a new vintage, not a duplicate."""
    v1 = _raw(close="105", knowledge_time="2026-01-01T00:00:05Z")
    v2 = _raw(close="106", knowledge_time="2026-01-01T06:00:00Z")  # correction
    result = _ingest(v1, v2)
    assert result.quarantined == ()
    assert len(result.accepted) == 2
    assert {r.value.close for r in result.accepted} == {105.0, 106.0}


# --- certification + reproducibility ----------------------------------------


def test_all_bad_yields_quarantined_dataset() -> None:
    result = _ingest(_raw(close="-1"))
    assert result.accepted == ()
    assert result.dataset.certification is CertificationStatus.QUARANTINED


def test_content_address_is_reproducible() -> None:
    """DATA-39/DE-2: identical input -> identical dataset id + content address."""
    a = _ingest(_raw())
    b = _ingest(_raw())
    assert a.content_address == b.content_address
    assert a.dataset.id == b.dataset.id
    assert a.dataset.id.value.startswith("DS-")


def test_content_address_is_order_independent() -> None:
    r1 = _raw(symbol="btcusdt")
    r2 = _raw(symbol="ethusdt", event_time="2026-01-01T00:05:00Z", knowledge_time="2026-01-01T00:05:05Z")
    a = _ingest(r1, r2)
    b = _ingest(r2, r1)
    assert a.content_address == b.content_address


def test_bad_config_rejected() -> None:
    with pytest.raises(IngestionConfigError):
        _ingest(_raw(), config=_config(dataset_name=""))
    with pytest.raises(IngestionConfigError):
        _ingest(_raw(), config=_config(price_precision=-1))
