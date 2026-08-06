"""Workflow Definition — the versioned, contract-bound process definition (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import VersionTag

from workflow_engine.metadata import WorkflowMetadata
from workflow_engine.transition import TransitionSpec


@dataclass(frozen=True, slots=True)
class WorkflowDefinition:
    """The immutable, versioned definition of a workflow: its declared transitions + metadata."""

    definition_id: VersionTag
    transitions: tuple[TransitionSpec, ...]
    metadata: WorkflowMetadata


@dataclass(frozen=True, slots=True)
class Workflow:
    """A named, versioned workflow (the contract-bound process). Immutable."""

    definition: WorkflowDefinition
