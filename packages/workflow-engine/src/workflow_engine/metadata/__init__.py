"""Workflow Metadata — the descriptive, versioned metadata of a workflow (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion


@dataclass(frozen=True, slots=True)
class WorkflowMetadata:
    """Immutable metadata for a workflow definition.

    ``tier5_contract`` references the ratified Tier-5 Workflow Contract (e.g. ``"WFC-46"``); the
    contract remains authoritative for the rules (this is only a pointer).
    """

    name: str
    owner: str            # named accountable human role (WFC-8)
    tier5_contract: str   # reference to the Tier-5 Workflow Contract id
    version: SchemaVersion
    description: str
