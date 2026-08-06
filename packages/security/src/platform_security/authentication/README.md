# security · authentication

> **Phase 3.5 Authentication & Authorization Foundation — canonical security abstractions, interfaces
> only.** Technology- and vendor-independent, secure, auditable. No authentication protocols, no
> OAuth/JWT/SSO, no authentication provider, no persistence, no infrastructure. Authorization is
> deterministic and never AI-policed; access is least-privilege / default-deny.

## Purpose

Define AuthMethod, AuthenticationRequest, AuthenticationResult, and the Authenticator interface.

## Responsibilities

Represent authentication requests/results with credential references only (no password/JWT) and expose an authenticator interface; hold no OAuth/JWT/SSO protocol.

## Relationships

Consumed by services/gateways; the concrete IdP plugs in behind the interface.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (SEC-3, SEC-2, CODE-29); Architecture V2 §6.5; RB-27 · SEC; TDR §18.
