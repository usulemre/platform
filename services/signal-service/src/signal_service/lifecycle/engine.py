"""Signal Lifecycle Engine — the deterministic signal state machine + isolation barrier (AD-1/3, RL-2).

The eleventh deterministic engine in the platform. Signals are the raw material of the trading chain
(Signal → Portfolio → Risk → Execution), and the two adversaries the Constitution names attack here
first: self-deception (a generator that peeks at validation) and gross selection (choosing on
pre-cost performance). This engine governs every lifecycle transition and refuses the transitions
that would let either adversary in.

Enforced by construction:

* **Fail-closed state machine (RL-1, RL-2).** Only transitions in the canonical table are allowed;
  a terminal state (``RETIRED``) transitions nowhere. Every signal therefore has a defined death,
  not only a birth (RL-2). Any other move raises ``IllegalSignalTransition``.
* **Isolation barrier (AD-3, P2-07, AP-3).** Generation must never have observed validation/OOS
  outcomes; a transition into ``GENERATED`` carrying ``generator_observed_validation`` raises
  ``GeneratorObservedValidation``. This is the air-gap that stops a generator from learning to
  defeat its validator.
* **Net-of-cost from the first screen (AD-1, AP-10).** A signal must be net-of-cost at generation;
  a gross signal raises ``GrossSignalSelection`` — gross selection is prohibited from the outset.
* **Risk before capital (RS-1, PS-1).** A signal may not become ``ACTIVE`` without an independent
  Risk approval (``SignalMissingRiskApproval``); ``APPROVED`` requires cleared validation (VS-2).
* **No ML/AI decision (AI-1, DE-1).** An AI actor driving a transition is rejected
  (``MLSignalDecision``). Deterministic (DE-2): a transition is a pure function of its inputs.
"""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import ActorKind, ActorRef

from signal_service.errors import (
    GeneratorObservedValidation,
    GrossSignalSelection,
    IllegalSignalTransition,
    MLSignalDecision,
    SignalMissingRiskApproval,
)
from signal_service.lifecycle import CANONICAL_TRANSITIONS, TERMINAL_STATES, SignalLifecycle

#: Frozen lookup of the canonical edges — any (current, to) not present is forbidden (fail closed).
_ALLOWED: frozenset[tuple[SignalLifecycle, SignalLifecycle]] = frozenset(CANONICAL_TRANSITIONS)

L = SignalLifecycle


@dataclass(frozen=True, slots=True)
class SignalTransition:
    """A requested lifecycle transition and the evidence its target state requires."""

    current: SignalLifecycle
    to: SignalLifecycle
    actor: ActorRef  # who is driving the transition (never AI, DE-1)
    net_of_cost: bool = True  # AD-1: required at generation
    generator_observed_validation: bool = False  # P2-07: must be False at generation
    validation_passed: bool = False  # VS-2: required to reach APPROVED
    risk_approved: bool = False  # RS-1: required to reach ACTIVE


class SignalLifecycleEngine:
    """The deterministic Signal Lifecycle Engine. Fulfils the intent of
    ``core_domain.signal.SignalLifecycleService`` with an enforced state machine and guards."""

    def transition(self, t: SignalTransition) -> SignalLifecycle:
        # AI-1/DE-1: an AI/ML actor may never decide a signal transition.
        if t.actor.kind is ActorKind.AI_AGENT:
            raise MLSignalDecision("an AI/ML actor may not decide a signal transition (DE-1, AI-1)")
        # RL-1/RL-2: terminal states are dead ends — re-opening means a new versioned lineage.
        if t.current in TERMINAL_STATES:
            raise IllegalSignalTransition(f"{t.current.value!r} is terminal; open a new signal version")
        # Fail closed: only canonical edges are permitted.
        if (t.current, t.to) not in _ALLOWED:
            raise IllegalSignalTransition(
                f"transition {t.current.value!r} -> {t.to.value!r} is not canonical"
            )
        self._check_guards(t)
        return t.to

    @staticmethod
    def _check_guards(t: SignalTransition) -> None:
        if t.to is L.GENERATED:
            # P2-07/AD-3: the generator must not have seen validation/OOS outcomes.
            if t.generator_observed_validation:
                raise GeneratorObservedValidation(
                    "signal generation observed validation/OOS outcomes (AD-3, P2-07)"
                )
            # AD-1/AP-10: net-of-cost from the first screen.
            if not t.net_of_cost:
                raise GrossSignalSelection("a signal must be net-of-cost from the first screen (AD-1)")
        elif t.to is L.APPROVED:
            # VS-2: approval requires cleared validation.
            if not t.validation_passed:
                raise IllegalSignalTransition(
                    "cannot approve a signal whose validation has not cleared (VS-2)"
                )
        elif t.to is L.ACTIVE:
            # RS-1/PS-1: activation requires an independent Risk approval.
            if not t.risk_approved:
                raise SignalMissingRiskApproval(
                    "a signal may not become ACTIVE without an approved Risk assessment (RS-1)"
                )


__all__ = ["SignalLifecycleEngine", "SignalTransition"]
