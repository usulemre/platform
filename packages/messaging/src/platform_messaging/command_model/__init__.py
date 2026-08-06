"""Command Model — command message envelope and handler interface (imperatives to engines)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Command, Response  # re-exported payload bases

from platform_messaging.metadata import MessageHeader


@dataclass(frozen=True, slots=True)
class CommandMessage:
    """An envelope binding a command payload (by type) to messaging metadata."""

    header: MessageHeader
    command_type: str  # fully-qualified command contract type name


class CommandHandler(Protocol):
    """A component that handles exactly one command type, returning a response. Interface only.

    A command is a request to a deterministic engine/service; the handler never lets AI decide.
    """

    def handle(self, command: Command) -> Response: ...


__all__ = ["Command", "Response", "CommandMessage", "CommandHandler"]
