"""API Core — the canonical Admin API request/response envelope models (data only; generic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

from platform_contracts.common import CorrelationId

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ApiVersion:
    """The semantic version of the Admin API contract (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class ResourceIdentifier:
    """A canonical, opaque administrative resource reference (never an internal domain aggregate, SE-2)."""

    resource_type: str
    id: str


@dataclass(frozen=True, slots=True)
class ApiMetadata:
    """Immutable metadata on every Admin API message.

    ``security_context_ref`` references the authenticated administrator (no credentials, SEC-3);
    ``correlation_id`` gives end-to-end traceability (CP-7); ``occurred_at`` is supplied (CS-3).
    """

    api_version: ApiVersion
    correlation_id: CorrelationId
    security_context_ref: str
    occurred_at: str


class AdminStatus(Enum):
    OK = "ok"
    ACCEPTED = "accepted"                 # accepted; a workflow was triggered
    PENDING_COUNTER_SIGN = "pending_counter_sign"  # awaiting independent counter-sign (HO-2)
    REJECTED = "rejected"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class AdminRequest(Generic[T]):
    """An immutable administrative request: metadata + a typed admin DTO (never a domain model)."""

    meta: ApiMetadata
    payload: T


@dataclass(frozen=True, slots=True)
class AdminResponse(Generic[T]):
    """An immutable, canonical administrative response: metadata + status + a typed admin DTO."""

    meta: ApiMetadata
    status: AdminStatus
    payload: T | None


@dataclass(frozen=True, slots=True)
class ErrorResponse:
    """An immutable canonical error response (never leaks provider/internal details)."""

    meta: ApiMetadata
    error_code: str
    message: str
