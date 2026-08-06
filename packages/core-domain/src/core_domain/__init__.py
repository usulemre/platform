"""core_domain — the platform's canonical, asset-agnostic domain model.

This package defines the *shared language* used by every service, workflow, AI agent, and
deterministic engine: bounded-context modules, entities, value objects, aggregates, repository
and domain-service *interfaces*, domain events, and domain errors.

Purity contract (enforced by review, RB-20 · CODE):
    * standard library only — no third-party, framework, infrastructure, UI, persistence, or AI;
    * no ambient non-determinism — time and randomness are injected, never read here (CS-3, PIT-4);
    * no asset-class branching — the core is asset-agnostic (CP-8);
    * consequential artifacts are immutable and versioned (CP-2); this layer models that, it does
      not persist it.

Each bounded-context module depends only on ``core_domain.shared``; cross-context references are by
identity (``shared.Ref`` or typed ids), never by importing another context's aggregate (SE-2).
"""

__all__ = [
    "shared",
    "research", "dataset", "experiment", "feature", "signal", "strategy",
    "portfolio", "risk", "validation", "execution", "workflow", "agent", "governance",
]
__version__ = "0.1.0"
