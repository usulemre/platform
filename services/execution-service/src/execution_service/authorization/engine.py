"""Execution Authorization Engine — the deterministic gate before any external adapter (RS-4, DEP-1).

The sixth deterministic engine in the platform and the constitutional heart of trading. It is the
final authority that decides whether an execution may proceed and *in which mode* — the last
deterministic checkpoint before an order could ever reach an external venue. It provides the
enforcement the ``ExecutionAuthorizationService`` interface (this package's ``__init__``) only
describes.

Enforced by construction:

* **Paper-first (DEP-1).** PAPER is the default, permissive path: no governance token is required.
  LIVE is never the default and is only ever reached through the strict gate below.
* **Token-gated, time-boxed live (RS-4, FB-12).** LIVE is *impossible* without a valid, unexpired
  ``AuthorizationToken``. A missing or expired token fails closed with ``UnauthorizedExecution``.
  Expiry is judged against a *supplied* instant (the injected clock, CS-3/PIT-4) — no wall-clock is
  read here, so the same request always yields the same verdict (DE-2).
* **No AI executes or authorizes (AI-1, FB-1).** An AI actor driving authorization is rejected
  outright with ``AIExecutionAttempt`` — before any other consideration.
* **Kill-switch forces HALT (RS-3, ARCH §2.10, HO-4).** An engaged kill-switch dominates every
  requested mode and yields HALT. It is never gated by AI: it is plain state the engine always
  honours.
* **Capital-affecting requires APPROVE + counter-sign (HO-2).** LIVE requires an actor holding
  ``APPROVE`` authority and an independent counter-signature; a ``narrates``/``proposes`` actor can
  authorize nothing (AG-2).
* **Clearances are read, never re-adjudicated (CP-5, PS-1).** LIVE requires prior validation, an
  independent Risk sign-off (``MissingRiskAuthority``, RS-1/2) and a clean research↔production parity
  check (``ParityBreach``, P3-15). The engine consumes these clearances as evidence; it does not
  re-run the science, preserving separation of powers — exactly as the Scientific Gate does.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from core_domain.execution import AuthorizationToken, ExecutionMode
from core_domain.shared import ActorKind, ActorRef, Authority, KnowledgeTime, Ref

from execution_service.authorization import ExecutionAuthorization
from execution_service.errors import (
    AIExecutionAttempt,
    MissingRiskAuthority,
    ParityBreach,
    UnauthorizedExecution,
)


@dataclass(frozen=True, slots=True)
class AuthorizationEvidence:
    """The prior clearances LIVE authorization reads (CP-5). Each is produced by a *separate* engine.

    ``validated`` — the execution passed lifecycle validation; ``risk_signed_off`` — an independent
    Risk Engine authority exists (RS-1/2); ``parity_clean`` — research↔production parity is within
    tolerance (P3-15). PAPER does not require them.
    """

    validated: bool
    risk_signed_off: bool
    parity_clean: bool


@dataclass(frozen=True, slots=True)
class AuthorizationRequest:
    """One authorization request at the execution gate."""

    execution: Ref  # -> the execution/order under authorization
    requested_mode: ExecutionMode  # the mode the caller asks for (a ceiling, never an upgrade)
    authorizer: ActorRef  # who is authorizing (never AI; APPROVE required for LIVE)
    now: KnowledgeTime  # the supplied instant used to judge token expiry (injected clock)
    evidence: AuthorizationEvidence
    token: AuthorizationToken | None = None  # required (valid + unexpired) for LIVE
    counter_signed: bool = False  # independent human counter-sign, required for LIVE (HO-2)
    kill_switch_engaged: bool = False  # dominant safety state: forces HALT (RS-3)


@dataclass(frozen=True, slots=True)
class AuthorizationDecision:
    """The immutable, explainable outcome of the gate (EXP-2). Wraps the granted authorization."""

    authorization: ExecutionAuthorization
    rationale: str

    @property
    def mode(self) -> ExecutionMode:
        return self.authorization.mode


class ExecutionAuthorizationEngine:
    """The deterministic Execution Authorization gate (RS-4, DEP-1).

    Value object in, immutable decision out; a violated invariant fails closed as a typed
    ``ExecutionError``. Replaceable behind ``ExecutionAuthorizationService`` without touching
    consumers (SE-3).
    """

    def authorize(self, request: AuthorizationRequest) -> AuthorizationDecision:
        # AI-1/FB-1: an AI actor may never drive authorization — reject before anything else.
        if request.authorizer.kind is ActorKind.AI_AGENT:
            raise AIExecutionAttempt("an AI actor may not authorize execution (AI-1)")

        # RS-3/HO-4: an engaged kill-switch dominates every requested mode.
        if request.kill_switch_engaged:
            return self._halt(request, "kill-switch engaged (RS-3): execution forced to HALT")

        if request.requested_mode is ExecutionMode.HALT:
            return self._halt(request, "HALT requested")

        self._require_authorizing_authority(request)

        if request.requested_mode is ExecutionMode.PAPER:
            return self._grant(
                request,
                ExecutionMode.PAPER,
                token=None,
                rationale="paper-first default (DEP-1); no governance token required",
            )

        # ExecutionMode.LIVE — the strict, fail-closed path.
        self._authorize_live(request)
        return self._grant(
            request,
            ExecutionMode.LIVE,
            token=request.token,
            rationale=(
                "live authorized: valid time-boxed token + independent counter-sign + validation, "
                "risk and parity clearances (RS-4, HO-2, P3-15)"
            ),
        )

    # ---- checks -----------------------------------------------------------------------------

    @staticmethod
    def _require_authorizing_authority(request: AuthorizationRequest) -> None:
        actor = request.authorizer
        # AG-2: a narrates/proposes actor cannot authorize execution in any mode.
        if actor.authority not in (Authority.DECIDE, Authority.APPROVE):
            raise UnauthorizedExecution(
                f"actor authority {actor.authority.value!r} may not authorize execution (AG-2)"
            )
        # HO-2: capital-affecting LIVE additionally requires APPROVE authority.
        if request.requested_mode is ExecutionMode.LIVE and actor.authority is not Authority.APPROVE:
            raise UnauthorizedExecution(
                "live execution requires an actor holding APPROVE authority (HO-2)"
            )

    def _authorize_live(self, request: AuthorizationRequest) -> None:
        if request.token is None:
            raise UnauthorizedExecution(
                "live execution requires a governance authorization token (RS-4, FB-12)"
            )
        if self._is_expired(request.now, request.token):
            raise UnauthorizedExecution(
                "the governance authorization token has expired (time-boxed, RS-4)"
            )
        if not request.counter_signed:
            raise UnauthorizedExecution(
                "capital-affecting live execution requires an independent counter-sign (HO-2)"
            )
        if not request.evidence.validated:
            raise UnauthorizedExecution("execution has not passed validation; live is refused")
        if not request.evidence.risk_signed_off:
            raise MissingRiskAuthority(
                "live execution requires an independent Risk Engine sign-off (RS-1/2)"
            )
        if not request.evidence.parity_clean:
            raise ParityBreach("research-to-production parity breach blocks live execution (P3-15)")

    @staticmethod
    def _is_expired(now: KnowledgeTime, token: AuthorizationToken) -> bool:
        """True (deny) when ``now`` is at or after the token's expiry. Fails closed on any bad input.

        Instants are supplied normalized ISO-8601 (UTC). A malformed or mismatched pair cannot be
        proven unexpired, so it is treated as expired — the safe direction (fail closed).
        """
        try:
            return _parse(now.at.iso8601) >= _parse(token.expires_at.at.iso8601)
        except (ValueError, TypeError):
            return True

    # ---- construction -----------------------------------------------------------------------

    @staticmethod
    def _grant(
        request: AuthorizationRequest,
        mode: ExecutionMode,
        token: AuthorizationToken | None,
        rationale: str,
    ) -> AuthorizationDecision:
        return AuthorizationDecision(
            authorization=ExecutionAuthorization(
                mode=mode,
                token=token,
                authorizer_role=request.authorizer.id,
                counter_signed=request.counter_signed,
            ),
            rationale=rationale,
        )

    @classmethod
    def _halt(cls, request: AuthorizationRequest, rationale: str) -> AuthorizationDecision:
        return cls._grant(request, ExecutionMode.HALT, token=None, rationale=rationale)


def _parse(iso8601: str) -> datetime:
    return datetime.fromisoformat(iso8601.replace("Z", "+00:00"))


__all__ = [
    "AuthorizationDecision",
    "AuthorizationEvidence",
    "AuthorizationRequest",
    "ExecutionAuthorizationEngine",
]
