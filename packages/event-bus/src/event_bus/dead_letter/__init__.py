"""Dead Letter Abstractions — reuse the messaging dead-letter primitives + a dead-letter router."""
from __future__ import annotations

from typing import Protocol

from platform_messaging.dead_letter import DeadLetterPolicy, DeadLetterQueue, DeadLetterRecord  # reuse


class DeadLetterRouter(Protocol):
    """Routes exhausted events to the dead-letter queue for inspection/replay. Interface only.

    Dead-lettered events are recorded immutably for audit and may be replayed (auditability, CP-7).
    """

    def route_to_dlq(self, record: DeadLetterRecord) -> None: ...


__all__ = ["DeadLetterPolicy", "DeadLetterRecord", "DeadLetterQueue", "DeadLetterRouter"]
