# security — Authentication & Authorization Foundation implemented in Phase 3.5

This package now contains the Authentication & Authorization Foundation (the `platform_security`
package): identity core, principal registry, role management, permission model, access control,
security context, authentication, authorization, policy engine, audit support, identity lifecycle,
security events, and the error model. Authentication protocols, OAuth/JWT/SSO, authentication
providers, persistence, and infrastructure remain forbidden here. Concrete providers (Keycloak/OIDC
for identity, OPA for policy, SPIFFE/SPIRE for workload identity, per the TDR) plug in behind these
canonical interfaces.
