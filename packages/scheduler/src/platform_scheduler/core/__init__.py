"""Scheduler Core — the canonical job identity, categories, context, and the ScheduledJob model."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import CorrelationId, SchemaVersion

from platform_scheduler.lifecycle import JobStatus


class JobCategory(Enum):
    """The canonical categories of scheduled workloads across the platform."""

    DATASET_INGESTION = "dataset_ingestion"
    DATA_QUALITY_VALIDATION = "data_quality_validation"
    FEATURE_GENERATION = "feature_generation"
    EXPERIMENT_EXECUTION = "experiment_execution"
    BACKTESTING = "backtesting"
    RISK_REVIEW = "risk_review"
    SIGNAL_REFRESH = "signal_refresh"
    PORTFOLIO_REBALANCING = "portfolio_rebalancing"
    EXECUTION_PREPARATION = "execution_preparation"
    GOVERNANCE_TASKS = "governance_tasks"
    SYSTEM_MAINTENANCE = "system_maintenance"


@dataclass(frozen=True, slots=True)
class ScheduleIdentifier:
    """A stable, versioned identity for a schedule/job (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class SchedulerContext:
    """Immutable, deterministic context for a scheduling decision.

    ``as_of`` is a supplied point-in-time boundary; the scheduler reads no wall-clock (CS-3).
    """

    correlation_id: CorrelationId
    as_of: str | None


@dataclass(frozen=True, slots=True)
class ScheduledJob:
    """A registered, deterministically schedulable job.

    ``target_ref`` references the work to run (a service/workflow/engine) by identity; the job holds no
    business logic and runs nothing itself.
    """

    identifier: ScheduleIdentifier
    category: JobCategory
    target_ref: str
    status: JobStatus
