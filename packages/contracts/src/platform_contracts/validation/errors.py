"""Validation error contracts."""
from __future__ import annotations

from enum import Enum


class ValidationErrorCode(Enum):
    OOS_REUSE = "validation.oos_reuse"                        # SI-4, P2-05
    UNDEFLATED_SIGNIFICANCE = "validation.undeflated"         # SI-3
    LLM_VALIDATION_ATTEMPT = "validation.llm_attempt"         # AI-2, FB-2
    REPLICATION_FAILED = "validation.replication_failed"      # VS-4, P2-08
