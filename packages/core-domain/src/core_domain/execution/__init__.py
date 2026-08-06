"""Execution bounded context — paper-first, token-gated, deterministic execution."""
from __future__ import annotations

from .contracts import ExecutionAuthority, OrderRepository, ParityHarness, ReconciliationService
from .errors import AIExecutionAttempt, IrreversibleDeployment, ParityBreach, UnauthorizedExecution
from .events import ExecutionAuthorized, FillRecorded, ParityBreachDetected
from .model import (
    AuthorizationToken,
    ExecutionMode,
    Fill,
    Order,
    ParityReport,
    PositionLedgerEntry,
)

__all__ = [
    "ExecutionMode", "AuthorizationToken", "ParityReport", "Fill",
    "Order", "PositionLedgerEntry",
    "ExecutionAuthorized", "FillRecorded", "ParityBreachDetected",
    "OrderRepository", "ExecutionAuthority", "ParityHarness", "ReconciliationService",
    "UnauthorizedExecution", "AIExecutionAttempt", "ParityBreach", "IrreversibleDeployment",
]
