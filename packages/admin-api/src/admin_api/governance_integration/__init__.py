"""Governance Integration — the admin governance-enforcement INTERFACE (approval + counter-sign; mandatory).

Control-changing / capital-affecting operations require human approval AND independent counter-sign
(HO-2); an override MUST NOT bypass a hard control (HO-3); no AI approves (AI-3). Fail-closed.
"""
from __future__ import annotations

from typing import Protocol


class GovernanceGuard(Protocol):
    """Enforces governance rules on an administrative operation before it proceeds. Interface only.

    ``requires_counter_sign`` is True for control-changing / capital-affecting operations (HO-2);
    ``is_permitted`` is fail-closed and never let an override bypass a hard control (HO-3); no AI approves.
    """

    def is_permitted(self, operation_ref: str) -> bool: ...
    def requires_counter_sign(self, operation_ref: str) -> bool: ...
