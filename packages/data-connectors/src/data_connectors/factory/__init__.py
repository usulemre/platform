"""Connector Factory — constructs canonical Connectors behind the vendor-neutral interface (no adapters)."""
from __future__ import annotations

from typing import Protocol

from platform_contracts.common import Id

from data_connectors.authentication import AuthenticationProfile
from data_connectors.configuration import ConnectionProfile
from data_connectors.core import Connector


class ConnectorFactory(Protocol):
    """Constructs a canonical Connector for a provider + configuration + auth profile. Interface only.

    It returns the vendor-neutral Connector; the concrete provider adapter is out of scope and plugs
    in behind this interface (extensibility / vendor independence, AV2-12).
    """

    def create(
        self, provider: Id, profile: ConnectionProfile, auth: AuthenticationProfile
    ) -> Connector: ...
