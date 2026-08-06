"""Dataset Registration — the register-before-use registration application service & workflow."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from dataset_service.model import Dataset


class DatasetRegistrationService(Protocol):
    """Orchestrates register-before-use registration of a dataset (DP-1). Interface only.

    Delegates existence to the Data Platform registry; performs no persistence. Registration is a
    governed transition; nothing is served before it is registered.
    """

    def request_registration(self, dataset: Dataset) -> EntityId: ...
    def confirm_registration(self, dataset: EntityId) -> None: ...


class DatasetRegistrationWorkflow(Protocol):
    """Drives the registration -> validation-request stages via deterministic gates. Interface only.

    It orchestrates; every gate delegates to its owning engine. No decision logic here.
    """

    def run(self, dataset: EntityId) -> None: ...
