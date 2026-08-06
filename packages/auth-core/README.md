# @platform/auth-core

The canonical **Authentication Core** — the provider-independent authentication framework for every
provider, exchange, broker and external service (Phase 8.1.6). It integrates with the
`@platform/http-client` middleware pipeline.

## What it provides

- **Pure crypto** (deterministic, dependency-free): SHA-256, HMAC-SHA256, hex/base64/base64url,
  constant-time compare — verified against NIST/RFC vectors.
- **Secret abstraction**: `SecretProvider` with `InMemorySecretProvider` and `EnvSecretProvider`
  (injected env), plus `maskSecret`.
- **Immutable credentials**: `ApiKeyCredential`, `BearerTokenCredential`, `HmacCredential`,
  `OAuth2Credential` — secret material held in `#private` fields (invisible to logs/JSON/spreads),
  frozen, with expiry.
- **Managers**: `CredentialManager` (+ secret-provider builders), `TokenManager` (OAuth2 refresh
  foundation), `ApiKeyManager`.
- **Signing framework**: `SignatureService` — **HMAC-SHA256 real**; RSA-SHA256 / ECDSA-SHA256
  foundations (throw until an adapter is injected). `NonceGenerator`s and `TimestampProvider` (injected).
- **Validation**: `CredentialValidator` (presence/expiry/well-formedness) and **HS256 JWT validation**
  (signature + `exp`/`nbf`); RS256/ES256 via an injected verifier.
- **Rotation**: `CredentialRotator` (due-for-rotation + swap with grace window).
- **Strategies**: `ApiKeyStrategy`, `BearerTokenStrategy`, `HmacSignatureStrategy` (injectable
  canonicalization). `AuthenticationService` facade, `AuthenticationContext`, `AuthenticationMetrics`.
- **Middleware**: `createAuthenticationMiddleware` — the real authentication middleware for the pipeline
  (replaces the Phase 8.1.2 placeholder).

## Security

Secret VALUES never appear in logs, errors or serialized output — only references and masks.
Comparisons are constant-time; credentials are immutable; time and nonces are injected so signing is
deterministic. Foundations (OAuth2 refresh, RSA/ECDSA) are contracts that throw until injected. No
provider-specific credentials or schemes are implemented here.

## Example

```ts
import { AuthenticationService, createAuthenticationMiddleware } from '@platform/auth-core';
import {
  MiddlewarePipeline,
  MiddlewareHttpClient,
  FetchHttpTransport,
} from '@platform/http-client';

const auth = new AuthenticationService();
auth.apiKeys.addHmac({
  id: 'main',
  key: 'PUBLIC',
  secret: '<from-secret-provider>',
  createdAt: Date.now(),
});
const middleware = createAuthenticationMiddleware({
  service: auth,
  resolve: () => auth.hmacStrategy('main'),
});
const http = new MiddlewareHttpClient({
  transport: new FetchHttpTransport(),
  pipeline: MiddlewarePipeline.of(middleware),
});
```

## Scripts

`pnpm --filter @platform/auth-core typecheck | lint | test`
