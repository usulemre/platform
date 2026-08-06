"""Execution error contracts."""
from __future__ import annotations

from enum import Enum


class ExecutionErrorCode(Enum):
    UNAUTHORIZED_EXECUTION = "execution.unauthorized"          # RS-4, FB-12
    AI_EXECUTION_ATTEMPT = "execution.ai_attempt"              # AI-1, FB-1
    PARITY_BREACH = "execution.parity_breach"                  # P3-15
    IRREVERSIBLE_DEPLOYMENT = "execution.irreversible"         # DEP-3
