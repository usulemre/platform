"""Scheduler Domain Events — immutable facts about jobs/schedules (subclass the domain event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class JobRegistered(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobScheduled(DomainEvent):
    job_id: EntityId
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class JobStarted(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobCompleted(DomainEvent):
    job_id: EntityId


@dataclass(frozen=True, slots=True)
class JobFailed(DomainEvent):
    job_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class JobRetried(DomainEvent):
    job_id: EntityId
    attempt: int


@dataclass(frozen=True, slots=True)
class JobCancelled(DomainEvent):
    job_id: EntityId
    reason: str


@dataclass(frozen=True, slots=True)
class ScheduleUpdated(DomainEvent):
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionWindowOpened(DomainEvent):
    schedule_id: EntityId


@dataclass(frozen=True, slots=True)
class ExecutionWindowClosed(DomainEvent):
    schedule_id: EntityId
