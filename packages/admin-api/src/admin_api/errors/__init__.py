"""Error Model — the canonical, technology-independent Admin API error model (no internal details)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class AdminErrorKind(Enum):
    VALIDATION_FAILED = "validation_failed"
    UNAUTHENTICATED = "unauthenticated"
    FORBIDDEN = "forbidden"                      # authorization denied (default-deny, SEC-2)
    COUNTER_SIGN_REQUIRED = "counter_sign_required"  # control-change needs counter-sign (HO-2)
    GOVERNANCE_VIOLATION = "governance_violation"    # override attempted to bypass a control (HO-3)
    WORKFLOW_REQUIRED = "workflow_required"      # a consequential op requires a workflow (WCON-2)
    AGENT_CONTRACT_BYPASS = "agent_contract_bypass"  # agent admin bypassed Agent Contracts (AI-1..4)
    DOMAIN_MODEL_LEAK = "domain_model_leak"      # an internal domain model was exposed (boundary, SE-2)
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    INTERNAL = "internal"


@dataclass(frozen=True, slots=True)
class AdminError:
    """A canonical, technology-independent admin error (leaks no internal/provider details)."""

    kind: AdminErrorKind
    code: str
    message: str
