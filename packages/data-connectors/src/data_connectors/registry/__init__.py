"""Provider Registry — register-before-use registry of providers and connectors (no persistence)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from data_connectors.core import Connector
from data_connectors.provider import Provider


class ProviderRegistry(Protocol):
    """Append-only, register-before-use registry of providers and connectors. Interface only.

    A connector is not usable before registration; the concrete registry stores elsewhere. No provider
    details leak through the registry.
    """

    def register_provider(self, provider: Provider) -> None: ...
    def register_connector(self, connector: Connector) -> None: ...
    def get_connector(self, connector: Id) -> Connector: ...
    def get_provider(self, provider: Id) -> Provider: ...
