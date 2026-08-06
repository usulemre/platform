"""Message Validation — STRUCTURAL validation of a message envelope (never statistical, AI-2)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import ValidationResult  # re-exported structural result

from platform_messaging.message_model import MessageEnvelope


class MessageValidator(Protocol):
    """Validates a message envelope against its schema/rules before publish. Interface only.

    Structural validation only — it MUST NOT assert statistical significance (AI-2, DE-4).
    """

    def validate(self, envelope: MessageEnvelope) -> ValidationResult: ...


__all__ = ["ValidationResult", "MessageValidator"]
