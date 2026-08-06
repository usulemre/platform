# data-connectors · authentication

> **Phase 3.1 Data Connectors Framework — vendor-independent abstractions, interfaces only.**
> Technology-independent, extensible, composable. No provider APIs, no REST/WebSocket clients, no
> authentication logic, no business/research/statistical logic, no infrastructure. Exposes only
> canonical interfaces; never exposes provider-specific models or leaks vendor details.

## Purpose

Define AuthenticationProfile, AuthMethod, and AuthSecretRef: vendor-neutral authentication with secrets by reference.

## Responsibilities

Represent authentication as a method + secret REFERENCE (never a credential value); hold no authentication logic (the broker/adapter performs auth).

## Dependencies

Standard library only.

## Relationships

Consumed by factory (connector creation); aligns with the secrets broker (OpenBao).

## Related Governance Documents

CLAUDE.md (SEC-3, CODE-29, FB-14, AV2-12); Architecture V2 §5.8, §6.5; RB-27 · SEC; TDR §19.
