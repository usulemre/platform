"""Pre-Capital Scientific Governance Gate — the deterministic capital-eligibility adjudicator (P2-09).

The fourth deterministic engine in the platform. No factor may become capital-eligible without
passing this gate (RG-1). It is an *independent adjudicator* (CP-5, RG-2): it lives in its own
service, apart from generation, and it never re-runs the science — it only checks that each required
clearance was produced by its own upstream engine, and then issues or withholds the
``CapitalEligibilityToken``.

Enforced by construction:

* **All clearances required (RG-1).** Multiple-testing budget (P2-02), leakage harness (P2-03),
  purged/embargoed CV (P2-06), one-shot holdout (P2-05), independent replication (P2-08) and an
  evaluated economic rationale (P3-12). Any unmet clearance withholds the token.
* **Statistical enforcement cannot be overridden (HO-3, FB-8).** A human override presented against
  an unmet *statistical* control is void and is rejected (``ControlBypassOverride``) — it cannot buy
  eligibility that the science did not earn.
* **No AI adjudication or override (AI-3, AI-4, HO-1).** An AI actor may neither adjudicate the gate
  nor override it.
* **Deterministic (DE-1, DE-2).** Same submission ⇒ same decision and same content-addressed token
  id. No wall-clock is read; the issuance instant is supplied (CS-3, PIT-4).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from core_domain.governance import (
    AIOverrideAttempt,
    CapitalEligibilityToken,
    ControlBypassOverride,
    Override,
    UnauthorizedApproval,
)
from core_domain.shared import ActorKind, ActorRef, Authority, KnowledgeTime, Ref


@dataclass(frozen=True, slots=True)
class ScientificClearances:
    """The upstream clearances required before capital eligibility (RG-1). Each is produced and
    signed off by a *separate* deterministic engine; this gate only reads them (CP-5)."""

    multiple_testing_compliant: bool  # P2-02, deflated budget
    leakage_cleared: bool  # P2-03
    purged_embargoed_cv: bool  # P2-06
    holdout_evaluated_once: bool  # P2-05, one-shot
    independently_replicated: bool  # P2-08
    economic_rationale_evaluated: bool  # P3-12


#: Clearances that constitute *statistical enforcement*; a human override against any of these is
#: void (HO-3). The economic rationale is required too, but is a qualitative gate, not enforcement.
_STATISTICAL_CONTROLS: tuple[str, ...] = (
    "multiple_testing_compliant",
    "leakage_cleared",
    "purged_embargoed_cv",
    "holdout_evaluated_once",
    "independently_replicated",
)

_ALL_CONTROLS: tuple[str, ...] = _STATISTICAL_CONTROLS + ("economic_rationale_evaluated",)


@dataclass(frozen=True, slots=True)
class GovernanceSubmission:
    """One adjudication request at the scientific gate."""

    subject: Ref  # -> the factor/strategy under review
    clearances: ScientificClearances
    adjudicator: ActorRef  # who is running the gate (must be independent, non-AI)
    issued_at: KnowledgeTime  # supplied issuance instant for a granted token
    override: Override | None = None  # an optional human override (rejected if it bypasses controls)


@dataclass(frozen=True, slots=True)
class GovernanceDecision:
    """The immutable outcome of the gate: granted (with token) or withheld (with unmet reasons)."""

    granted: bool
    token: CapitalEligibilityToken | None
    unmet: tuple[str, ...]


class ScientificGovernanceGate:
    """The deterministic Pre-Capital Scientific Governance Gate (P2-09)."""

    def adjudicate(self, submission: GovernanceSubmission) -> GovernanceDecision:
        self._check_adjudicator(submission.adjudicator)
        unmet = self._unmet(submission.clearances)
        if submission.override is not None:
            self._reject_illegal_override(submission.override, unmet)
        if unmet:
            return GovernanceDecision(granted=False, token=None, unmet=unmet)
        token = self._issue(submission.subject, submission.issued_at)
        return GovernanceDecision(granted=True, token=token, unmet=())

    # ---- checks -------------------------------------------------------------------------

    @staticmethod
    def _check_adjudicator(actor: ActorRef) -> None:
        # AI-3: an LLM/agent may never approve a promotion.
        if actor.kind is ActorKind.AI_AGENT:
            raise UnauthorizedApproval("an AI actor may not adjudicate the scientific gate (AI-3)")
        if actor.authority not in (Authority.DECIDE, Authority.APPROVE):
            raise UnauthorizedApproval(
                f"actor authority {actor.authority.value!r} may not adjudicate capital eligibility"
            )

    @staticmethod
    def _unmet(c: ScientificClearances) -> tuple[str, ...]:
        return tuple(name for name in _ALL_CONTROLS if not getattr(c, name))

    @staticmethod
    def _reject_illegal_override(override: Override, unmet: tuple[str, ...]) -> None:
        # HO-1/AI-4: an AI may never override a human governance decision.
        if override.approver.kind is ActorKind.AI_AGENT:
            raise AIOverrideAttempt("an AI actor may not override the scientific gate (AI-4)")
        # HO-3: an override that tries to bypass a failed statistical control is void.
        if any(name in _STATISTICAL_CONTROLS for name in unmet):
            raise ControlBypassOverride(
                "override cannot bypass unmet statistical enforcement (HO-3); it is void"
            )

    # ---- issuance -----------------------------------------------------------------------

    @staticmethod
    def _issue(subject: Ref, issued_at: KnowledgeTime) -> CapitalEligibilityToken:
        # Content-addressed, deterministic token id (NM-2): same subject + instant ⇒ same id.
        payload = f"{subject.id}\x1f{issued_at.at.iso8601}".encode()
        token_id = "CET-" + hashlib.sha256(payload).hexdigest()[:16]
        return CapitalEligibilityToken(id=token_id, subject=subject, issued_at=issued_at)


__all__ = [
    "GovernanceDecision",
    "GovernanceSubmission",
    "ScientificClearances",
    "ScientificGovernanceGate",
]
