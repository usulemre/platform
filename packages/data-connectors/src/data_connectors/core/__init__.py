"""Connector Core — the canonical connector model, connector types, and the connector INTERFACE.

The Connector interface is vendor-neutral: connect/disconnect/fetch use canonical models only and
expose NO provider-specific models. Concrete adapters implement it behind these interfaces.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import Id, SchemaVersion

from data_connectors.lifecycle import ConnectionStatus
from data_connectors.request import DataRequest
from data_connectors.response import DataResponse


class ConnectorType(Enum):
    """The supported connector types (vendor-neutral)."""

    MARKET_DATA = "market_data"
    EXCHANGE = "exchange"
    BROKER = "broker"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    NEWS = "news"
    MACRO = "macro"
    REFERENCE = "reference"


@dataclass(frozen=True, slots=True)
class ConnectorIdentifier:
    """A stable, versioned identity for a connector (NM-2)."""

    name: str
    version: SchemaVersion


@dataclass(frozen=True, slots=True)
class Connector:
    """A registered, vendor-neutral connector (canonical model; no provider details)."""

    identifier: ConnectorIdentifier
    connector_type: ConnectorType
    provider_id: Id
    status: ConnectionStatus


class ConnectorProtocol(Protocol):
    """The canonical connector interface. Interface only — no client, no provider API here.

    ``fetch`` accepts a canonical DataRequest and returns a canonical DataResponse (opaque payload); it
    exposes no provider-specific models and leaks no vendor details.
    """

    def connect(self) -> None: ...
    def disconnect(self) -> None: ...
    def fetch(self, request: DataRequest) -> DataResponse: ...


class MarketDataConnector(ConnectorProtocol, Protocol):
    """Marker: a market-data connector."""


class ExchangeConnector(ConnectorProtocol, Protocol):
    """Marker: an exchange connector (read-only market data; NOT order routing)."""


class BrokerConnector(ConnectorProtocol, Protocol):
    """Marker: a broker connector abstraction (data/reference only at this layer; NOT execution)."""


class FundamentalDataConnector(ConnectorProtocol, Protocol):
    """Marker: a fundamental-data connector."""


class AlternativeDataConnector(ConnectorProtocol, Protocol):
    """Marker: an alternative-data connector."""


class NewsConnector(ConnectorProtocol, Protocol):
    """Marker: a news connector."""


class MacroDataConnector(ConnectorProtocol, Protocol):
    """Marker: a macro-data connector."""


class ReferenceDataConnector(ConnectorProtocol, Protocol):
    """Marker: a reference-data connector (symbology, calendars, corporate actions inputs)."""
