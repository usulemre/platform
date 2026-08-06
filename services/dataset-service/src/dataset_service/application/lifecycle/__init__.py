"""Dataset Lifecycle — the lifecycle coordinator orchestrating operational dataset transitions."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.lifecycle import DatasetLifecycle


class DatasetLifecycleCoordinator(Protocol):
    """Coordinates the operational dataset lifecycle via deterministic gates. Interface only.

    Registration -> validation -> publication -> deprecation -> archival, plus version promotion and
    governed replacement. Publication requires a passed certification gate (DI-1); transitions are
    fail-closed against the canonical set. No decision logic here.
    """

    def publish(self, dataset: EntityId) -> None: ...
    def deprecate(self, dataset: EntityId) -> None: ...
    def archive(self, dataset: EntityId) -> None: ...
    def current_state(self, dataset: EntityId) -> DatasetLifecycle: ...
