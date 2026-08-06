# data-connectors · configuration

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define ConnectionProfile: the vendor-neutral connection configuration (logical endpoint reference, non-secret parameters, retry & rate-limit policies).

## Responsibilities

Represent connection configuration in vendor-neutral terms; carry no secrets and no vendor-specific fields; hold no logic.

## Dependencies

retry (RetryPolicy); rate_limit (RateLimitPolicy); standard library.

## Relationships

Consumed by factory; secrets are referenced via the AuthenticationProfile.

## Related Governance Documents

CLAUDE.md (SEC-3, AV2-12, DEP-1); Architecture V2 §5.8, §6.5; RB-27 · SEC; TDR §20.
