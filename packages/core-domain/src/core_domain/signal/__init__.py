"""Signal bounded context — the signal generation lifecycle."""
from __future__ import annotations

from .contracts import SignalLifecycleService, SignalRepository
from .errors import GeneratorObservedValidation, GrossSelection
from .events import SignalGenerated, SignalRetired
from .model import Signal, SignalLifecycle, SignalSpec

__all__ = [
    "SignalLifecycle", "SignalSpec", "Signal",
    "SignalGenerated", "SignalRetired",
    "SignalRepository", "SignalLifecycleService",
    "GrossSelection", "GeneratorObservedValidation",
]
