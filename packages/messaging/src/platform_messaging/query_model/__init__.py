"""Query Model — query message envelope and handler interface (reads; as-of where historical)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Query, Response  # re-exported payload bases

from platform_messaging.metadata import MessageHeader


@dataclass(frozen=True, slots=True)
class QueryMessage:
    """An envelope binding a query payload (by type) to messaging metadata."""

    header: MessageHeader
    query_type: str


class QueryHandler(Protocol):
    """A component that answers exactly one query type. Interface only.

    Historical reads carry an as-of on the concrete query (PIT-1); the handler performs no ambient read.
    """

    def handle(self, query: Query) -> Response: ...


__all__ = ["Query", "Response", "QueryMessage", "QueryHandler"]
