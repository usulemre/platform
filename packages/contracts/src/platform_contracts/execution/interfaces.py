"""Execution authority, parity, and reconciliation contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import AuthorizeExecution, AuthorizeExecutionResponse, OrderDto, ParityReportDto


class OrderRepositoryContract(Protocol):
    def get(self, id: Id) -> OrderDto: ...
    def add(self, order: OrderDto) -> None: ...


class ExecutionAuthorityContract(Protocol):
    """Deterministic execution; live impossible without a token; AI never executes (RS-4, AI-1)."""

    def authorize(self, command: AuthorizeExecution) -> AuthorizeExecutionResponse: ...


class ParityHarnessContract(Protocol):
    def check(self, order_id: Id) -> ParityReportDto: ...


class ReconciliationServiceContract(Protocol):
    def reconcile(self) -> bool: ...
