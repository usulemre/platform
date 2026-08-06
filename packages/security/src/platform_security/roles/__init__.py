"""Role Management — the role model, role assignment, and role-management INTERFACE (RBAC; no logic)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import Id


@dataclass(frozen=True, slots=True)
class Role:
    """A role bundling a permission set (role-based authorization)."""

    name: str
    permission_set_ref: str
    description: str


@dataclass(frozen=True, slots=True)
class RoleAssignment:
    """An immutable assignment of a role to a principal (recorded, auditable)."""

    principal_ref: str
    role: str


class RoleManagementService(Protocol):
    """Assigns/revokes roles (RBAC). Interface only — least-privilege; recorded and auditable."""

    def assign_role(self, assignment: RoleAssignment) -> None: ...
    def revoke_role(self, principal: Id, role: str) -> None: ...
