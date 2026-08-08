"""Integration test for the data path: raw vault -> ingest -> As-Of Gateway -> point-in-time read.

This proves the boundary is real: canonical records produced by the ingestion pipeline are readable
through the deterministic As-Of Gateway with correct no-look-ahead and restatement semantics
(DI-1, PIT-1/3, DATA-16). Unlike the pipeline unit tests, it exercises ingest + storage together.
"""
from __future__ import annotations

from core_domain.shared import (
    ActorKind,
    ActorRef,
    AsOf,
    Authority,
    EntityId,
    KnowledgeTime,
    Timestamp,
    Version,
)
from core_domain.shared.provenance import LineageRef
from data_ingestion_service.ingestion import (
    CanonicalBar,
    IngestionConfig,
    MarketDataIngestionPipeline,
    RawMarketRecord,
)
from platform_storage.as_of_gateway import InMemoryAsOfGateway

ENGINE = ActorRef(id="engine:ingest", kind=ActorKind.DETERMINISTIC_ENGINE, authority=Authority.DECIDE)


def _config() -> IngestionConfig:
    return IngestionConfig(
        dataset_name="binance.spot.klines",
        dataset_version=Version(1, 0, 0),
        symbology={"btcusdt": "BTC/USDT"},
        price_precision=2,
        volume_precision=4,
        source_trust_tier="T1",
        produced_by=ENGINE,
        lineage=LineageRef(id="LIN-1"),
    )


def _raw(event: str, knowledge: str, close: str) -> RawMarketRecord:
    return RawMarketRecord(
        source="binance",
        payload_hash="ph",
        symbol="btcusdt",
        event_time=event,
        knowledge_time=knowledge,
        open="100",
        high="120",
        low="90",
        close=close,
        volume="10",
    )


def _load(records: tuple[RawMarketRecord, ...]) -> tuple[InMemoryAsOfGateway[CanonicalBar], object]:
    result = MarketDataIngestionPipeline().ingest(records, _config())
    gateway: InMemoryAsOfGateway[CanonicalBar] = InMemoryAsOfGateway()
    for rec in result.accepted:
        gateway.append(rec)  # only certified canonical records reach the read path (DI-1)
    return gateway, result


def _as_of(iso: str) -> AsOf:
    return AsOf(knowledge_time=KnowledgeTime(at=Timestamp(iso)))


def test_ingested_bar_is_readable_as_of() -> None:
    gateway, _ = _load((_raw("2026-01-01T00:00:00Z", "2026-01-01T00:00:05Z", "105"),))
    bar = gateway.read_as_of(
        EntityId("BTC/USDT@2026-01-01T00:00:00+00:00"), _as_of("2026-01-01T01:00:00+00:00")
    )
    assert isinstance(bar, CanonicalBar)
    assert bar.symbol == "BTC/USDT" and bar.close == 105.0


def test_no_look_ahead_before_knowledge_time() -> None:
    """PIT-3: a read before the bar was known returns nothing (no look-ahead)."""
    from core_domain.shared import NotFound

    gateway, _ = _load((_raw("2026-01-01T00:00:00Z", "2026-01-01T00:00:05Z", "105"),))
    try:
        gateway.read_as_of(
            EntityId("BTC/USDT@2026-01-01T00:00:00+00:00"), _as_of("2026-01-01T00:00:00+00:00")
        )
        raise AssertionError("expected NotFound: the bar was not yet known at this as_of")
    except NotFound:
        pass


def test_restatement_read_before_and_after() -> None:
    """DATA-16/DI-3: an as-of read before a correction sees the old value; after, the new value."""
    records = (
        _raw("2026-01-01T00:00:00Z", "2026-01-01T00:00:05Z", "105"),  # original
        _raw("2026-01-01T00:00:00Z", "2026-01-01T06:00:00Z", "106"),  # restatement
    )
    gateway, result = _load(records)
    assert len(result.accepted) == 2  # both vintages kept (no overwrite)
    entity = EntityId("BTC/USDT@2026-01-01T00:00:00+00:00")
    before = gateway.read_as_of(entity, _as_of("2026-01-01T01:00:00+00:00"))
    after = gateway.read_as_of(entity, _as_of("2026-01-01T07:00:00+00:00"))
    assert before.close == 105.0  # original, as known at 01:00
    assert after.close == 106.0  # corrected, as known at 07:00


def test_quarantined_records_never_reach_the_read_path() -> None:
    """DI-1/DI-2: a bad record is quarantined and is never appended to the canonical store."""
    records = (
        _raw("2026-01-01T00:00:00Z", "2026-01-01T00:00:05Z", "105"),  # clean
        _raw("2026-01-01T00:01:00Z", "2026-01-01T00:01:05Z", "-1"),  # non-positive price
    )
    gateway, result = _load(records)
    assert len(result.accepted) == 1
    assert len(result.quarantined) == 1
    # the quarantined bar's entity is absent from the read path
    from core_domain.shared import NotFound

    try:
        gateway.read_as_of(
            EntityId("BTC/USDT@2026-01-01T00:01:00+00:00"), _as_of("2026-01-02T00:00:00+00:00")
        )
        raise AssertionError("quarantined record must not be readable")
    except NotFound:
        pass
