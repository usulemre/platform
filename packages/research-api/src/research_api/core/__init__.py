"""API Core — the canonical API request/response envelope models (data only; generic)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

from platform_contracts.common import CorrelationId

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ApiVersion:
    """The semantic version of the API contract (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class ResourceIdentifier:
    """A canonical, opaque resource reference (never an internal domain aggregate, SE-2)."""

    resource_type: str
    id: str


@dataclass(frozen=True, slots=True)
class ApiMetadata:
    """Immutable metadata on every API message.

    ``security_context_ref`` references the authenticated principal (no credentials, SEC-3);
    ``correlation_id`` gives end-to-end traceability (CP-7); ``occurred_at`` is supplied (CS-3).
    """

    api_version: ApiVersion
    correlation_id: CorrelationId
    security_context_ref: str
    occurred_at: str


@dataclass(frozen=True, slots=True)
class ApiRequest(Generic[T]):
    """An immutable API request: metadata + a typed API payload (a DTO, never a domain model)."""

    meta: ApiMetadata
    payload: T


class ApiStatus(Enum):
    OK = "ok"
    CREATED = "created"
    ACCEPTED = "accepted"       # accepted; a workflow was triggered
    REJECTED = "rejected"
    ERROR = "error"


@dataclass(frozen=True, slots=True)
class ApiResponse(Generic[T]):
    """An immutable, canonical API response: metadata + status + a typed API payload."""

    meta: ApiMetadata
    status: ApiStatus
    payload: T | None


@dataclass(frozen=True, slots=True)
class ErrorResponse:
    """An immutable canonical error response (never leaks provider/internal details)."""

    meta: ApiMetadata
    error_code: str
    message: str
