"""Golden-set tests for the As-Of Data Gateway (VS-1, CS-2).

Each test pins one constitutional guarantee of the point-in-time read path (CP-3, PIT-1, DI-3).
"""
from __future__ import annotations

import pytest
from core_domain.shared import (
    AsOf,
    BitemporalStamp,
    EntityId,
    EventTime,
    KnowledgeTime,
    NotFound,
    PointInTimeViolation,
    Timestamp,
)
from platform_storage.as_of_gateway import BitemporalRecord, InMemoryAsOfGateway


def _stamp(event: str, knowledge: str) -> BitemporalStamp:
    return BitemporalStamp(
        event_time=EventTime(Timestamp(event)),
        knowledge_time=KnowledgeTime(Timestamp(knowledge)),
    )


def _as_of(knowledge: str) -> AsOf:
    return AsOf(KnowledgeTime(Timestamp(knowledge)))


def _record(entity: str, value: object, event: str, knowledge: str) -> BitemporalRecord:
    return BitemporalRecord(EntityId(entity), value, _stamp(event, knowledge))


def test_read_without_as_of_fails_closed() -> None:
    """PIT-1: a historical read without an AsOf boundary must fail closed, not default to 'now'."""
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    gw.append(_record("AAPL", "v1", event="2024-01-01T00:00:00Z", knowledge="2024-01-01T00:00:00Z"))
    with pytest.raises(PointInTimeViolation):
        gw.read_as_of(EntityId("AAPL"), None)  # type: ignore[arg-type]


def test_unknown_entity_as_of_raises_not_found() -> None:
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    with pytest.raises(NotFound):
        gw.read_as_of(EntityId("MSFT"), _as_of("2024-06-01T00:00:00Z"))


def test_no_look_ahead() -> None:
    """CP-3/PIT-3: a record known only later must be invisible to an earlier as-of read."""
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    gw.append(_record("AAPL", "known-later", event="2024-01-01T00:00:00Z", knowledge="2024-03-01T00:00:00Z"))
    # Boundary is before the record became known -> nothing is visible.
    with pytest.raises(NotFound):
        gw.read_as_of(EntityId("AAPL"), _as_of("2024-02-01T00:00:00Z"))
    # At/after the knowledge_time it becomes visible.
    assert gw.read_as_of(EntityId("AAPL"), _as_of("2024-03-01T00:00:00Z")) == "known-later"


def test_restatement_is_vintage_correct() -> None:
    """DI-3: an as-of read before a restatement returns the old value; after, the new one."""
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    # Same event_time, restated with a newer knowledge_time (e.g. a vendor correction).
    gw.append(_record("GDP", "first-print", event="2024-Q1", knowledge="2024-04-30T00:00:00Z"))
    gw.append(_record("GDP", "revised", event="2024-Q1", knowledge="2024-05-30T00:00:00Z"))

    assert gw.read_as_of(EntityId("GDP"), _as_of("2024-05-01T00:00:00Z")) == "first-print"
    assert gw.read_as_of(EntityId("GDP"), _as_of("2024-06-01T00:00:00Z")) == "revised"


def test_boundary_is_inclusive() -> None:
    """A record known exactly at the as-of instant is visible (inclusive boundary)."""
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    gw.append(_record("X", "v", event="2024-01-01T00:00:00Z", knowledge="2024-01-01T00:00:00Z"))
    assert gw.read_as_of(EntityId("X"), _as_of("2024-01-01T00:00:00Z")) == "v"


def test_deterministic_repeated_reads() -> None:
    """DE-2: identical store state + as_of yields an identical result every time."""
    gw: InMemoryAsOfGateway[str] = InMemoryAsOfGateway()
    gw.append(_record("Y", "a", event="2024-01-01T00:00:00Z", knowledge="2024-01-01T00:00:00Z"))
    gw.append(_record("Y", "b", event="2024-02-01T00:00:00Z", knowledge="2024-02-01T00:00:00Z"))
    as_of = _as_of("2024-03-01T00:00:00Z")
    results = {gw.read_as_of(EntityId("Y"), as_of) for _ in range(5)}
    assert results == {"b"}
