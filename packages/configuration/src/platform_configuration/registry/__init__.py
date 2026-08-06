"""Configuration Registry — the append-only, versioned registry INTERFACE (no persistence)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import VersionTag

from platform_configuration.lifecycle import ConfigurationLifecycle
from platform_configuration.scope import ConfigurationScope


@dataclass(frozen=True, slots=True)
class ConfigurationRecord:
    """An immutable registry record of a configuration's existence and status."""

    config_id: VersionTag
    scope: ConfigurationScope
    lifecycle: ConfigurationLifecycle


class ConfigurationRegistry(Protocol):
    """Append-only, versioned registry of configurations (register-before-use, immutable). Interface only.

    No loading or persistence here; the concrete registry stores records elsewhere.
    """

    def get(self, config_id: VersionTag) -> ConfigurationRecord: ...
    def register(self, record: ConfigurationRecord) -> None: ...
