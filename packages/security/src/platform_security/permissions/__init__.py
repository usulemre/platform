"""Permission Model — least-privilege permissions and permission sets (default-deny, SEC-2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class PermissionEffect(Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass(frozen=True, slots=True)
class Permission:
    """A least-privilege permission: an action on a resource.

    Access is default-deny beyond explicitly granted permissions (SEC-2); an explicit DENY overrides.
    """

    resource: str
    action: str
    effect: PermissionEffect


@dataclass(frozen=True, slots=True)
class PermissionSet:
    """An immutable set of permissions (the grant bundled into a role)."""

    permissions: tuple[Permission, ...]
