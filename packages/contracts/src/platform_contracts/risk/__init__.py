"""Risk bounded-context contracts (Phase 1.2). Immutable, versioned, technology-independent."""
from __future__ import annotations

from platform_contracts.common import SchemaVersion

from . import errors, events, interfaces, messages

SCHEMA_VERSION = SchemaVersion(1, 0, 0)  # contract schema version for this module (VER-1)

__all__ = ["messages", "events", "interfaces", "errors", "SCHEMA_VERSION"]
