"""Signal Management — the Signal Engine application/service INTERFACES (deterministic; no overreach).

Orchestrates the signal lifecycle and gates activation on validation + mandatory Risk approval. It is
deterministic, net-of-cost, and holds NO portfolio-construction or execution authority. No AI/ML decides.
"""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.decision import SignalDecision
from signal_service.metadata import SignalMetadata


class SignalService(Protocol):
    """The Signal Engine service (interface only): drive the signal lifecycle."""

    def generate(self, subject: EntityId) -> EntityId: ...
    def submit_for_validation(self, signal: EntityId) -> None: ...
    def approve(self, signal: EntityId) -> None: ...
    def activate(self, signal: EntityId) -> None: ...
    def supersede(self, old: EntityId, new: EntityId) -> None: ...
    def retire(self, signal: EntityId) -> None: ...


class SignalEngineService(Protocol):
    """The deterministic signal decision gate: yields a SignalDecision for a subject. Interface only."""

    def decide(self, subject: EntityId) -> SignalDecision: ...


class SignalCatalogService(Protocol):
    """Describes signals from the catalog/registry. Interface only."""

    def describe(self, signal: EntityId) -> SignalMetadata: ...
