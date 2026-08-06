"""Risk repository, limit-engine, and kill-switch contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import (
    EngageKillSwitch,
    EvaluateRisk,
    RiskLimitDto,
    RiskVerdictResponse,
)


class RiskLimitRepositoryContract(Protocol):
    def get(self, id: Id) -> RiskLimitDto: ...
    def add(self, limit: RiskLimitDto) -> None: ...


class RiskLimitEngineContract(Protocol):
    """Deterministic limit evaluation (RS-1)."""

    def evaluate(self, command: EvaluateRisk) -> RiskVerdictResponse: ...


class KillSwitchContract(Protocol):
    """Human-invocable, never AI-gated (RS-3, HO-4)."""

    def engage(self, command: EngageKillSwitch) -> None: ...
