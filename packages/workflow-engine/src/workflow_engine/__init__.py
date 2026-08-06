"""workflow_engine — the technology-independent Workflow Control Layer abstractions.

Defines HOW workflows are represented, transitioned, validated, approved, escalated, executed,
and audited — as pure abstractions realizing the Tier-5 Workflow Contracts. It orchestrates; it
NEVER adjudicates: every gate delegates to a deterministic engine or a human approver (WCON-2,
AV2-18). No orchestration engine, no infrastructure, no persistence, no AI, no ambient time/RNG.

Modules: state, transition, state_machine, definition, instance, context, metadata, validation,
approval, escalation, execution, events, audit, policies, results.
"""
from __future__ import annotations

from . import (
    approval,
    audit,
    context,
    definition,
    escalation,
    events,
    execution,
    instance,
    metadata,
    policies,
    results,
    state,
    state_machine,
    transition,
    validation,
)

__all__ = [
    "state", "transition", "state_machine", "definition", "instance", "context", "metadata",
    "validation", "approval", "escalation", "execution", "events", "audit", "policies", "results",
]
__version__ = "0.1.0"
