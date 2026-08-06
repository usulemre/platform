"""Connector Metadata — the immutable, auditable metadata of a connector (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id

from data_connectors.core import ConnectorIdentifier, ConnectorType
from data_connectors.lifecycle import ConnectionStatus


@dataclass(frozen=True, slots=True)
class ConnectorMetadata:
    """Immutable metadata for a connector (auditable)."""

    identifier: ConnectorIdentifier
    connector_type: ConnectorType
    provider_id: Id
    owner_role: str
    status: ConnectionStatus
    tags: tuple[str, ...]
