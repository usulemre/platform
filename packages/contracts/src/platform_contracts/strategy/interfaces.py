"""Strategy repository and lifecycle contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import RegisterStrategy, RegisterStrategyResponse, RetireStrategy, StrategyDto


class StrategyRepositoryContract(Protocol):
    def get(self, id: Id) -> StrategyDto: ...
    def add(self, strategy: StrategyDto) -> None: ...


class StrategyLifecycleServiceContract(Protocol):
    def register(self, command: RegisterStrategy) -> RegisterStrategyResponse: ...
    def retire(self, command: RetireStrategy) -> None: ...
