"""Signal Decision Model — the deterministic decision to standardize an output into a signal (data)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DecisionVerdict(Enum):
    GENERATE = "generate"
    REJECT = "reject"


@dataclass(frozen=True, slots=True)
class SignalDecision:
    """A deterministic decision with an explainable rationale (EXP-2).

    The decision is deterministic and never made by an LLM/ML (AI-1, DE-1).
    """

    verdict: DecisionVerdict
    rationale: str
