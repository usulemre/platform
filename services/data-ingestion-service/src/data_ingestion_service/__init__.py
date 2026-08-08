"""data-ingestion-service — the deterministic raw-vault -> canonical bitemporal data path.

Transforms raw records already landed in the raw vault (DATA-10) into certified, provenance-bearing
canonical records readable through the As-Of Gateway (DI-1, PIT-1). Bad records are quarantined,
never silently repaired or dropped (DI-2, DATA-21). Deterministic (DE-2): no wall-clock, no I/O.
"""
from __future__ import annotations

__all__: list[str] = []
