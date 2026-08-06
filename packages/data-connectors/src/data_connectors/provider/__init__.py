"""Provider — the canonical provider model and capabilities (vendor-neutral; data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id

from data_connectors.core import ConnectorType


@dataclass(frozen=True, slots=True)
class ProviderCapabilities:
    """The vendor-neutral capabilities a provider supports (drives compatibility, not a vendor model)."""

    connector_types: tuple[ConnectorType, ...]
    supports_streaming: bool
    supports_historical: bool


@dataclass(frozen=True, slots=True)
class Provider:
    """A canonical, vendor-neutral provider (an external data source), by identity."""

    provider_id: Id
    name: str
    capabilities: ProviderCapabilities
