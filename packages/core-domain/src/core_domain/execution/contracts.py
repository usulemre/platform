"""Execution authority, parity, and reconciliation interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import AuthorizationToken, Order, ParityReport


class OrderRepository(Protocol):
    """Append-only repository of orders."""

    def get(self, id: EntityId) -> Order: ...
    def add(self, order: Order) -> None: ...


class ExecutionAuthority(Protocol):
    """Interface: deterministic execution; live is impossible without a valid token (RS-4, AI-1).

    An LLM MUST NEVER decide or authorize execution.
    """

    def execute(self, order: EntityId, token: AuthorizationToken | None) -> None: ...


class ParityHarness(Protocol):
    """Interface: research-to-production parity check (P3-15)."""

    def check(self, order: EntityId) -> ParityReport: ...


class ReconciliationService(Protocol):
    """Interface: reconciles the position ledger against reality. No logic here."""

    def reconcile(self) -> bool: ...
