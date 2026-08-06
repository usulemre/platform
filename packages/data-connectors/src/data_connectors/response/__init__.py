"""Response Model — the canonical, vendor-neutral data response (opaque, quarantine-bound payload).

The raw payload is referenced by content hash and routed to the raw vault/quarantine at ingestion
(DI-2); it is NEVER a provider-specific model and is NEVER exposed to research (DI-1).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import ContentHash


class ResponseStatus(Enum):
    OK = "ok"
    PARTIAL = "partial"
    EMPTY = "empty"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class DataResponse:
    """A canonical, vendor-neutral data response.

    ``payload_ref`` is an OPAQUE content-addressed reference to the raw payload in the raw vault /
    quarantine (DI-2); the framework exposes no provider structure and never serves this to research
    (DI-1). ``retrieved_at`` is a supplied ISO-8601 time.
    """

    status: ResponseStatus
    payload_ref: ContentHash
    record_count: int
    retrieved_at: str
