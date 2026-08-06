#!/usr/bin/env bash
#
# generate_configuration.sh — Phase 1.5 Configuration Foundation generator.
#
# Governed by: CLAUDE.md (SEC-3 secrets-by-reference, CODE-29 no secrets in repo, CP-2 immutability,
#              VER-1/2, CS-3, DEP-1 environment separation); Architecture V2 §5.10, §6.5; Implementation
#              Roadmap Phase 1; RB-27 · SEC; TDR §20 (declarative config, secrets by reference).
#
# Emits the Configuration ABSTRACTIONS under packages/configuration as `platform_configuration`:
# the configuration model (secrets held ONLY as references, never values), schema, metadata,
# validation interfaces, policies, versioning, scope, profiles, lifecycle, and registry.
# It contains NO configuration loading, NO environment parsing, NO secret storage, NO persistence,
# NO infrastructure, NO business logic. Technology-independent, deterministic, immutable,
# versionable, auditable, idempotent.
#
set -euo pipefail
ROOT="/Users/smartiks/platform"
PKG="$ROOT/packages/configuration"
SRC="$PKG/src/platform_configuration"
cd "$ROOT"

creadme() {
  # 1 dir 2 name 3 purpose 4 responsibilities 5 dependencies 6 relationships 7 gov
  cat > "$1/README.md" <<EOF
# configuration · $2

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose
$3

## Responsibilities
$4

## Dependencies
$5

## Relationships
$6

## Related Governance Documents
$7
EOF
}

# ===========================================================================
# PACKAGE METADATA + TOP-LEVEL
# ===========================================================================
mkdir -p "$SRC"

cat > "$PKG/pyproject.toml" <<'TOML'
# configuration — the technology-independent Configuration abstractions (Phase 1.5).
# Standard library + the platform contract kernel only. No loading/parsing/secret-storage deps.
[project]
name = "platform-configuration"
version = "0.1.0"
description = "Configuration abstractions: model, schema, scope, versioning, lifecycle, registry."
requires-python = ">=3.12"
dependencies = ["platform-contracts"]   # depends on the stable contract kernel only (IMP-10)

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/platform_configuration"]
TOML

cat > "$PKG/package.placeholder.md" <<'MD'
# configuration — implemented in Phase 1.5

This package now contains the Configuration Foundation (the `platform_configuration` package): the
configuration model (secrets by reference only), schema, metadata, validation interfaces, policies,
versioning, scope, profiles, lifecycle, and registry. Loading, environment parsing, secret storage,
persistence, and infrastructure remain forbidden here. The concrete config loader and secrets broker
(OpenBao, per the TDR) plug in behind these abstractions.
MD

cat > "$SRC/__init__.py" <<'PY'
"""platform_configuration — the technology-independent configuration abstractions.

Defines HOW configuration is represented, scoped, validated, versioned, and governed across the
platform. Secrets are held ONLY as references (never values, SEC-3, CODE-29); an ACTIVE
configuration is immutable and superseded by a new version (CP-2); configuration is deterministic
(no ambient reads, CS-3) and auditable.

Boundaries: no loading, no environment parsing, no secret storage, no persistence, no infrastructure,
no business logic. The concrete loader and secrets broker (OpenBao, per the TDR) plug in behind
these interfaces.

Modules: model, schema, metadata, validation, policies, versioning, scope, profiles, lifecycle,
registry.
"""
from __future__ import annotations

from . import (
    lifecycle,
    metadata,
    model,
    policies,
    profiles,
    registry,
    schema,
    scope,
    validation,
    versioning,
)

__all__ = [
    "model", "schema", "metadata", "validation", "policies", "versioning", "scope", "profiles",
    "lifecycle", "registry",
]
__version__ = "0.1.0"
PY

# ===========================================================================
# scope
# ===========================================================================
D="$SRC/scope"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Scope — the institutional scopes and their precedence (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ConfigurationScope(Enum):
    """The institutional configuration scopes (broad to narrow)."""

    GLOBAL = "global"
    PLATFORM = "platform"
    APPLICATION = "application"
    SERVICE = "service"
    WORKFLOW = "workflow"
    AGENT = "agent"
    EXPERIMENT = "experiment"
    DATASET = "dataset"
    ENVIRONMENT = "environment"
    DEPLOYMENT = "deployment"
    LOCAL = "local"


#: Precedence order (broad -> narrow). A NARROWER scope overrides a broader one deterministically.
SCOPE_PRECEDENCE: tuple[ConfigurationScope, ...] = (
    ConfigurationScope.GLOBAL,
    ConfigurationScope.PLATFORM,
    ConfigurationScope.APPLICATION,
    ConfigurationScope.SERVICE,
    ConfigurationScope.WORKFLOW,
    ConfigurationScope.AGENT,
    ConfigurationScope.EXPERIMENT,
    ConfigurationScope.DATASET,
    ConfigurationScope.ENVIRONMENT,
    ConfigurationScope.DEPLOYMENT,
    ConfigurationScope.LOCAL,
)


@dataclass(frozen=True, slots=True)
class ScopeSelector:
    """Selects a concrete instance of a scope (e.g. scope=SERVICE, selector='dataset-service')."""

    scope: ConfigurationScope
    selector: str
PY
creadme "$D" "scope" \
"Define the institutional configuration scopes (Global, Platform, Application, Service, Workflow, Agent, Experiment, Dataset, Environment, Deployment, Local), their precedence, and the ScopeSelector." \
"Enumerate scopes and their broad-to-narrow precedence (narrower overrides); data only, no resolution logic." \
"Standard library (enum) only." \
"Consumed by model, metadata, policies, registry." \
"CLAUDE.md (CP-8, SC-1); Architecture V2 §5.10; RB-27 · SEC; TDR §20."

# ===========================================================================
# lifecycle
# ===========================================================================
D="$SRC/lifecycle"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Lifecycle — the canonical lifecycle states and legal transitions (data only)."""
from __future__ import annotations

from enum import Enum


class ConfigurationLifecycle(Enum):
    """The canonical configuration lifecycle."""

    DRAFT = "draft"
    VALIDATED = "validated"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    RETIRED = "retired"
    # failure states
    INVALID = "invalid"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


L = ConfigurationLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ConfigurationLifecycle, ConfigurationLifecycle], ...] = (
    (L.DRAFT, L.VALIDATED),
    (L.VALIDATED, L.APPROVED),
    (L.APPROVED, L.ACTIVE),
    (L.ACTIVE, L.DEPRECATED),
    (L.DEPRECATED, L.RETIRED),
    # failure / holding
    (L.DRAFT, L.INVALID),
    (L.VALIDATED, L.REJECTED),
    (L.APPROVED, L.REJECTED),
    (L.ACTIVE, L.SUSPENDED),
    (L.SUSPENDED, L.ACTIVE),
    (L.SUSPENDED, L.RETIRED),
)

#: Terminal states (no further transitions).
TERMINAL_STATES: frozenset[ConfigurationLifecycle] = frozenset({L.RETIRED, L.REJECTED, L.INVALID})
PY
creadme "$D" "lifecycle" \
"Define ConfigurationLifecycle (DRAFT/VALIDATED/APPROVED/ACTIVE/DEPRECATED/RETIRED + INVALID/REJECTED/SUSPENDED), the canonical transitions, and terminal states." \
"Enumerate the lifecycle and its legal transitions as data; a deterministic engine enforces them fail-closed. No logic here." \
"Standard library (enum) only." \
"Consumed by metadata, policies, registry." \
"CLAUDE.md (CP-2, DEPR-1..3); Architecture V2 §5.10; RB-27 · SEC."

# ===========================================================================
# versioning
# ===========================================================================
D="$SRC/versioning"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Versioning — configuration version identity and compatibility policy (VER-1/2)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_contracts.common import SchemaVersion


class Compatibility(Enum):
    NONE = "none"
    BACKWARD = "backward"
    FORWARD = "forward"
    FULL = "full"


@dataclass(frozen=True, slots=True)
class ConfigurationVersion:
    """The immutable version identity of a configuration (a breaking change bumps major, VER-1)."""

    config_name: str
    version: SchemaVersion
    supersedes: str | None
    compatibility: Compatibility


class VersioningPolicy(Protocol):
    """Governs configuration evolution; historical versions remain interpretable (VER-2). Interface only."""

    def is_compatible(self, current: ConfigurationVersion, candidate: ConfigurationVersion) -> bool: ...
PY
creadme "$D" "versioning" \
"Define ConfigurationVersion (name + version + supersedes + compatibility), the Compatibility enum, and the VersioningPolicy interface." \
"Govern configuration versioning so historical configurations remain interpretable and changes are compatible; data + interface, no logic." \
"platform_contracts.common (SchemaVersion); standard library." \
"Consumed by metadata and registry." \
"CLAUDE.md (VER-1/2, CP-2, RP-1); Architecture V2 §5.10; RB-27 · SEC."

# ===========================================================================
# schema
# ===========================================================================
D="$SRC/schema"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Schema — the declarative schema a configuration is validated against (data only)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion


class FieldType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    ENUM = "enum"
    SECRET_REF = "secret_ref"  # a reference to a secret; the value is never inlined (SEC-3)
    LIST = "list"
    MAP = "map"
    DURATION = "duration"


@dataclass(frozen=True, slots=True)
class Constraint:
    """A named constraint on a field; evaluated by an outer validator (no logic here)."""

    name: str
    expression: str


@dataclass(frozen=True, slots=True)
class FieldSpec:
    """The declarative specification of one configuration field."""

    key: str
    type: FieldType
    required: bool
    secret: bool  # if True, the field MUST be a secret reference, never a literal (SEC-3)
    constraints: tuple[Constraint, ...]


@dataclass(frozen=True, slots=True)
class ConfigurationSchema:
    """An immutable, versioned schema for a configuration."""

    name: str
    version: SchemaVersion
    fields: tuple[FieldSpec, ...]
PY
creadme "$D" "schema" \
"Define ConfigurationSchema, FieldSpec, FieldType (incl. SECRET_REF), and Constraint: the declarative schema a configuration is validated against." \
"Describe configuration shape and constraints as immutable, versioned data; mark secret fields as references; hold no validation logic." \
"platform_contracts.common (SchemaVersion); standard library." \
"Consumed by validation; referenced by metadata/model." \
"CLAUDE.md (SEC-3, VER-1, CS-5); Architecture V2 §5.10, §6.5; RB-27 · SEC; TDR §20."

# ===========================================================================
# metadata
# ===========================================================================
D="$SRC/metadata"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Metadata — ownership, scope, version, lifecycle, and schema reference (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import SchemaVersion

from platform_configuration.lifecycle import ConfigurationLifecycle
from platform_configuration.scope import ConfigurationScope


@dataclass(frozen=True, slots=True)
class ConfigurationMetadata:
    """Immutable metadata for a configuration: who owns it, its scope, version, lifecycle, schema."""

    name: str
    owner: str            # named accountable role (CP-7)
    description: str
    scope: ConfigurationScope
    version: SchemaVersion
    lifecycle: ConfigurationLifecycle
    schema_ref: str       # reference to the ConfigurationSchema by name
PY
creadme "$D" "metadata" \
"Define ConfigurationMetadata: name, accountable owner, description, scope, version, lifecycle, and schema reference." \
"Carry immutable governance metadata for a configuration; reference (never inline) the schema; data only." \
"platform_contracts.common (SchemaVersion); scope; lifecycle." \
"Consumed by model and registry." \
"CLAUDE.md (CP-2/7, VER-1); Architecture V2 §5.10; RB-27 · SEC."

# ===========================================================================
# model
# ===========================================================================
D="$SRC/model"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Model — the immutable configuration, entries, and the secrets-by-reference value."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import VersionTag

from platform_configuration.metadata import ConfigurationMetadata
from platform_configuration.scope import ConfigurationScope


class ValueKind(Enum):
    LITERAL = "literal"
    SECRET_REF = "secret_ref"


@dataclass(frozen=True, slots=True)
class SecretRef:
    """A reference to a secret held by the secrets broker.

    The secret VALUE is NEVER stored here or anywhere in the repository/artifacts (SEC-3, CODE-29,
    FB-14). ``broker_path`` is only a reference resolved at runtime by the broker (OpenBao, per TDR).
    """

    broker_path: str


@dataclass(frozen=True, slots=True)
class ConfigValue:
    """A configuration value: a non-secret literal OR a secret reference — never a secret literal."""

    kind: ValueKind
    literal: str | None       # populated only for non-secret LITERAL values
    secret_ref: SecretRef | None  # populated only for SECRET_REF values


@dataclass(frozen=True, slots=True)
class ConfigKey:
    """A dotted configuration key path."""

    path: str


@dataclass(frozen=True, slots=True)
class ConfigEntry:
    """A single key/value pair within a configuration."""

    key: ConfigKey
    value: ConfigValue


@dataclass(frozen=True, slots=True)
class Configuration:
    """An immutable, versioned configuration for a scope (a set of entries + metadata).

    An ACTIVE configuration is never mutated; a change creates a new version (CP-2).
    """

    config_id: VersionTag
    scope: ConfigurationScope
    entries: tuple[ConfigEntry, ...]
    metadata: ConfigurationMetadata
PY
creadme "$D" "model" \
"Define the configuration model: Configuration, ConfigEntry, ConfigKey, ConfigValue, ValueKind, and SecretRef (secrets held ONLY as references)." \
"Represent an immutable, versioned configuration as data; hold secret references, never secret values (SEC-3); no loading/parsing." \
"platform_contracts.common (VersionTag); metadata; scope." \
"Consumed by validation, policies, registry." \
"CLAUDE.md (SEC-3, CODE-29, FB-14, CP-2); Architecture V2 §5.10, §6.5; RB-27 · SEC; TDR §19/§20."

# ===========================================================================
# validation
# ===========================================================================
D="$SRC/validation"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Validation — the validation result, error definitions, and validator interface.

STRUCTURAL validation only (schema/constraints); never statistical (AI-2). No loading/parsing here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from platform_configuration.model import Configuration
from platform_configuration.schema import ConfigurationSchema


class ConfigurationErrorCode(Enum):
    SCHEMA_VIOLATION = "config.schema_violation"
    MISSING_REQUIRED = "config.missing_required"
    LITERAL_SECRET = "config.literal_secret"          # a secret was inlined (SEC-3, FB-14)
    UNKNOWN_KEY = "config.unknown_key"
    INVALID_TRANSITION = "config.invalid_transition"  # lifecycle transition not allowed
    INCOMPATIBLE_VERSION = "config.incompatible_version"


@dataclass(frozen=True, slots=True)
class ConfigurationError:
    """A structured, immutable configuration error (a fact, not an exception)."""

    code: ConfigurationErrorCode
    key: str
    message: str


@dataclass(frozen=True, slots=True)
class ConfigurationViolation:
    """A single structural violation of a configuration against its schema."""

    key: str
    rule: str
    detail: str


@dataclass(frozen=True, slots=True)
class ConfigurationValidationResult:
    """The immutable outcome of validating a configuration against its schema."""

    valid: bool
    violations: tuple[ConfigurationViolation, ...]


class ConfigurationValidator(Protocol):
    """Validates a Configuration against a ConfigurationSchema. Interface only — no logic here."""

    def validate(
        self, configuration: Configuration, schema: ConfigurationSchema
    ) -> ConfigurationValidationResult: ...
PY
creadme "$D" "validation" \
"Define ConfigurationValidationResult, ConfigurationViolation, ConfigurationError, ConfigurationErrorCode, and the ConfigurationValidator interface." \
"Express structural validation of a configuration against its schema (never statistical); define the canonical configuration errors; hold no logic." \
"model; schema; standard library." \
"Used at the DRAFT->VALIDATED transition; complements policies." \
"CLAUDE.md (AI-2, DE-4, SEC-3); Architecture V2 §5.10; RB-27 · SEC; RB-20 · CODE."

# ===========================================================================
# policies
# ===========================================================================
D="$SRC/policies"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Policies — deterministic policy INTERFACES governing configuration (no logic)."""
from __future__ import annotations

from typing import Protocol

from platform_configuration.lifecycle import ConfigurationLifecycle
from platform_configuration.model import Configuration
from platform_configuration.scope import ConfigurationScope


class ConfigurationPolicy(Protocol):
    """Marker for a deterministic, versioned configuration policy."""

    ...


class SecretReferencePolicy(Protocol):
    """Rejects any inlined secret literal; secrets MUST be references (SEC-3, CODE-29). Interface only."""

    def has_literal_secret(self, configuration: Configuration) -> bool: ...


class ImmutabilityPolicy(Protocol):
    """An ACTIVE configuration is immutable; a change creates a new version (CP-2). Interface only."""

    def is_mutation_allowed(self, current: ConfigurationLifecycle) -> bool: ...


class ScopeOverridePolicy(Protocol):
    """Deterministically resolves the effective scope when scopes overlap (narrower wins). Interface only."""

    def effective_scope(self, scopes: tuple[ConfigurationScope, ...]) -> ConfigurationScope: ...
PY
creadme "$D" "policies" \
"Define the deterministic configuration policy interfaces: ConfigurationPolicy, SecretReferencePolicy, ImmutabilityPolicy, ScopeOverridePolicy." \
"Express the rules a deterministic engine enforces (no literal secrets, ACTIVE-immutability, scope precedence) as interfaces; hold no logic." \
"model; scope; lifecycle; standard library." \
"Enforced by the configuration engine; complements validation." \
"CLAUDE.md (SEC-3, CODE-29, CP-2, DE-1); Architecture V2 §5.10, §6.5; RB-27 · SEC."

# ===========================================================================
# profiles
# ===========================================================================
D="$SRC/profiles"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
"""Configuration Profiles — named environment/deployment profiles (data only; no env parsing)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from platform_contracts.common import SchemaVersion

from platform_configuration.scope import ConfigurationScope


class ProfileKind(Enum):
    ENVIRONMENT = "environment"  # e.g. development / staging / production
    DEPLOYMENT = "deployment"
    LOCAL = "local"


@dataclass(frozen=True, slots=True)
class ConfigurationProfile:
    """A named profile selecting configuration for an environment/deployment.

    Environment separation is expressed by profile; NO environment variable parsing happens here
    (that is the concrete loader's job) — this is a declarative selector only (DEP-1).
    """

    name: str
    kind: ProfileKind
    scope: ConfigurationScope
    version: SchemaVersion
PY
creadme "$D" "profiles" \
"Define ConfigurationProfile and ProfileKind: named environment/deployment/local profiles for environment separation." \
"Represent profiles declaratively for environment separation; hold no environment parsing or loading." \
"platform_contracts.common (SchemaVersion); scope; standard library." \
"Consumed by the configuration engine and deployment; relates to configs/environments." \
"CLAUDE.md (DEP-1, SEC-3); Architecture V2 §5.9, §5.10; RB-27 · SEC; TDR §20."

# ===========================================================================
# registry
# ===========================================================================
D="$SRC/registry"; mkdir -p "$D"
cat > "$D/__init__.py" <<'PY'
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
PY
creadme "$D" "registry" \
"Define ConfigurationRecord and the ConfigurationRegistry interface: the append-only, versioned inventory of configurations." \
"Express register-before-use, immutable, versioned configuration existence/status as an interface; hold no persistence." \
"platform_contracts.common (VersionTag); scope; lifecycle; standard library." \
"Consumed by the configuration engine and audit; parallels the platform registries." \
"CLAUDE.md (CP-2/7, VER-1/2); Architecture V2 §5.10; RB-27 · SEC."

echo "Configuration Foundation generated."
