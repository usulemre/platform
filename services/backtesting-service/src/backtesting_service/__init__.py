"""backtesting_service — the deterministic Backtesting Engine.

Evaluates quantitative strategies under controlled historical conditions and transforms validated
research artifacts into reproducible performance evidence. The same engine runs backtest/paper/live
differing only by injected clock and adapter (AV2-23); here only the backtest abstraction is defined.

Determinism & reproducibility: time is SIMULATED via the injected clock (PIT-4, BT-1); every run is
reproducible from its Run Manifest (P1-02, RP-1/2, EX-2); results are immutable and never manually
edited (BT-3/4). It reuses core_domain.shared (reproducibility spine) and platform_validation, and
references Experiment/Feature by identity.

Boundaries: NOT production execution, NOT live trading, NOT portfolio optimization. No simulation
algorithms, no statistical calculations, no broker/market connectivity, no persistence, no
infrastructure, no API. Significance is the deterministic Statistics/Validation engines' domain (AI-2,
SI-3); it produces evidence, it never adjudicates.

Modules: model, status, lifecycle, configuration, scenario, context, metadata, session,
simulation_coordination, validation_coordination, performance_reporting, result_management,
scenario_comparison, reproducibility, engine, policies, specifications, events, errors, repositories.
"""
from __future__ import annotations

from . import (
    configuration,
    context,
    engine,
    errors,
    events,
    lifecycle,
    metadata,
    model,
    performance_reporting,
    policies,
    repositories,
    reproducibility,
    result_management,
    scenario,
    scenario_comparison,
    session,
    simulation_coordination,
    specifications,
    status,
    validation_coordination,
)

__all__ = [
    "model", "status", "lifecycle", "configuration", "scenario", "context", "metadata", "session",
    "simulation_coordination", "validation_coordination", "performance_reporting",
    "result_management", "scenario_comparison", "reproducibility", "engine", "policies",
    "specifications", "events", "errors", "repositories",
]
__version__ = "0.1.0"
