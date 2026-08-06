"""Dead Letter Policy — the dead-letter policy, record, and queue interface (no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class DeadLetterPolicy:
    """When and where exhausted messages are dead-lettered."""

    enabled: bool
    max_attempts_before_dlq: int
    dlq_topic: str


@dataclass(frozen=True, slots=True)
class DeadLetterRecord:
    """An immutable record of a message routed to the dead-letter queue (auditable, CP-7)."""

    message_id: Id
    reason: str
    attempts: int


class DeadLetterQueue(Protocol):
    """Receives dead-lettered messages for inspection/replay. Interface only."""

    def send(self, record: DeadLetterRecord) -> None: ...
