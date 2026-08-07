"""trading-orchestration-service — the deterministic trading-chain composition seam (Layer 4).

Sequences the deterministic engines portfolio -> risk -> parity -> execution and threads each
engine's immutable artifact into the next, failing closed on any rejection and emitting one immutable
``TradingDecisionRecord`` for audit. It orchestrates; it never adjudicates (WCON-2, DH-7). See
``ADR-0001``.
"""
from __future__ import annotations

__all__: list[str] = []
