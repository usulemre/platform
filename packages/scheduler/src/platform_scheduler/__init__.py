"""platform_scheduler — the deterministic Scheduler Framework.

The deterministic orchestration layer responsible for planning, triggering, coordinating, and
monitoring scheduled workloads across the platform. It provides institutional scheduling abstractions
used by services, workflows, AI agents, and deterministic engines.

Determinism: triggers hold opaque schedule expressions (never cron-parsed here); execution windows are
supplied (no wall-clock/timers, CS-3); the planner is dependency-aware and reproducible. Scheduler
events subclass core_domain DomainEvent and flow on the Event Bus.

Boundaries: no cron parsing, no timers, no distributed scheduling, no business logic, no
infrastructure. The concrete scheduler/orchestrator (Temporal, per the TDR) plugs in behind these
interfaces.

Modules: core, lifecycle, trigger, window, retry, dependencies, planner, job_registry,
schedule_registry, monitoring, metadata, policies, events, errors.
"""
from __future__ import annotations

from . import (
    core,
    dependencies,
    errors,
    events,
    job_registry,
    lifecycle,
    metadata,
    monitoring,
    planner,
    policies,
    retry,
    schedule_registry,
    trigger,
    window,
)

__all__ = [
    "core", "lifecycle", "trigger", "window", "retry", "dependencies", "planner", "job_registry",
    "schedule_registry", "monitoring", "metadata", "policies", "events", "errors",
]
__version__ = "0.1.0"
