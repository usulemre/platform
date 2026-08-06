"""Governance bounded context — human approvals, tokens, overrides, and the tamper-evident audit."""
from __future__ import annotations

from .contracts import ApprovalEngine, ApprovalRepository, AuditTrail, TieredAutonomyPolicy
from .errors import (
    AIOverrideAttempt,
    ControlBypassOverride,
    MissingCounterSignature,
    UnauthorizedApproval,
)
from .events import GovernanceHalt, OverrideRecorded, ProductionDeploymentApproved
from .model import (
    Approval,
    ApprovalDecision,
    AuditChainEntry,
    CapitalEligibilityToken,
    CounterSignature,
    Override,
    Rationale,
)

__all__ = [
    "ApprovalDecision", "Rationale", "CounterSignature", "CapitalEligibilityToken",
    "AuditChainEntry", "Approval", "Override",
    "ProductionDeploymentApproved", "OverrideRecorded", "GovernanceHalt",
    "ApprovalRepository", "AuditTrail", "ApprovalEngine", "TieredAutonomyPolicy",
    "MissingCounterSignature", "AIOverrideAttempt", "ControlBypassOverride", "UnauthorizedApproval",
]
