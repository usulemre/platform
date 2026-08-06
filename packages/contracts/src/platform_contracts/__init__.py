"""platform_contracts — the canonical, immutable contract layer (the Contracts Spine).

Defines the formal, versioned messages exchanged between domains, services, workflows, AI agents,
and deterministic engines: Commands, Queries, Events, Requests, Responses, DTOs, plus the interface
contracts (Repository, Service), Policies, Specifications, Validation contracts, and Error contracts.

Stability contract (IMP-10/11, VER-1/2):
    * standard library only — no third-party, framework, infrastructure, persistence, or AI;
    * self-contained — depends on no other package, not even the domain model, so it is the stable
      integration waist (mapping between contract DTOs and domain objects lives in an outer layer);
    * immutable — every contract type is a frozen value; consumers never mutate a message;
    * versioned — every message carries a ``ContractMeta.schema_version`` (breaking changes bump
      major and preserve historical artifacts);
    * deterministic — time is supplied on the envelope, never read here (CS-3, PIT-4);
    * asset-agnostic — no asset-class branching (CP-8).
"""
from . import common

__all__ = [
    "common",
    "research", "dataset", "experiment", "feature", "signal", "strategy",
    "portfolio", "risk", "validation", "execution", "workflow", "agent", "governance",
]
__version__ = "0.1.0"
