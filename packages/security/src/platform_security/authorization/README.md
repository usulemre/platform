# security · authorization

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define AuthorizationRequest, AuthorizationResult, and the Authorizer interface: deterministic, least-privilege authorization.

## Responsibilities

Express deterministic, role/permission-based authorization (default-deny, explainable); an LLM never authorizes; hold no logic.

## Relationships

Consumed by access_control and services; evaluated by the policy engine.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-2, AV2-25, DE-1, AI-4); Architecture V2 §6.5, §6.3; RB-27 · SEC.
