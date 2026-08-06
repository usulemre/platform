"""Shared identity value objects (NM-2: a name denotes exactly one immutable artifact version)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class EntityId:
    """Opaque, stable identity of an entity within its bounded context."""

    value: str


@dataclass(frozen=True, slots=True)
class Version:
    """Semantic version; a breaking change bumps ``major`` (VER-1)."""

    major: int
    minor: int
    patch: int


@dataclass(frozen=True, slots=True)
class VersionedId:
    """A name + version that immutably denotes one artifact version (NM-2, VER-2)."""

    name: str
    version: Version


@dataclass(frozen=True, slots=True)
class ContentAddress:
    """Content-addressed identity (hash) of an immutable artifact (CP-2, P1-02)."""

    algorithm: str
    digest: str


@dataclass(frozen=True, slots=True)
class Ref:
    """A cross-context reference by identity only (SE-2).

    ``target`` names the referenced aggregate (e.g. ``"strategy.Strategy"``) for documentation;
    resolution happens in an outer layer, never inside the domain.
    """

    id: str
    target: str
