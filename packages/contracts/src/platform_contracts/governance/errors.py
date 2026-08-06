"""Governance error contracts."""
from __future__ import annotations

from enum import Enum


class GovernanceErrorCode(Enum):
    MISSING_COUNTER_SIGNATURE = "governance.missing_counter_signature"  # HO-2
    AI_OVERRIDE_ATTEMPT = "governance.ai_override_attempt"              # HO-1, AI-4
    CONTROL_BYPASS_OVERRIDE = "governance.control_bypass_override"      # HO-3 (void)
    UNAUTHORIZED_APPROVAL = "governance.unauthorized_approval"          # CP-5, HO-1
