"""Base marker types for contract messages. All are immutable (frozen); none carry behavior."""
from __future__ import annotations

from dataclasses import dataclass

from .envelope import ContractMeta


class Dto:
    """Marker base for a pure data-transfer object (no envelope, no behavior)."""

    __slots__ = ()


@dataclass(frozen=True, slots=True)
class Command:
    """An imperative request to a deterministic engine/service. A command never decides itself."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Query:
    """A read request. Historical reads carry an as-of on the concrete query (PIT-1)."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Event:
    """A past-tense, immutable fact published after a state change (a record, not a command)."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Request:
    """A synchronous request message to a service contract."""

    meta: ContractMeta


@dataclass(frozen=True, slots=True)
class Response:
    """A synchronous response message from a service contract."""

    meta: ContractMeta
