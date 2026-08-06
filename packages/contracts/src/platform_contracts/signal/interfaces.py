"""Signal repository and lifecycle contracts (interfaces only)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from .messages import RegisterSignal, RegisterSignalResponse, RetireSignal, SignalDto


class SignalRepositoryContract(Protocol):
    def get(self, id: Id) -> SignalDto: ...
    def add(self, signal: SignalDto) -> None: ...


class SignalLifecycleServiceContract(Protocol):
    def register(self, command: RegisterSignal) -> RegisterSignalResponse: ...
    def retire(self, command: RetireSignal) -> None: ...
