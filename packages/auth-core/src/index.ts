/**
 * @platform/auth-core — the canonical Authentication Core.
 *
 * The provider-independent authentication framework for every provider, exchange, broker and external
 * service. It ships pure, deterministic cryptography (SHA-256, HMAC-SHA256, base64url, constant-time
 * compare), a secret abstraction (`SecretProvider`, in-memory + env), immutable masked credentials
 * (API key, bearer, HMAC, OAuth2), the credential / token / API-key managers, a signing framework
 * (`SignatureService` — HMAC-SHA256 real; RSA/ECDSA foundations), nonce and timestamp providers, a
 * `CredentialValidator` (incl. HS256 JWT validation), a `CredentialRotator`, authentication context and
 * metrics, the authentication strategies (API key / bearer / HMAC signing), the `AuthenticationService`
 * facade, and a real authentication `Middleware` for the HTTP Middleware Pipeline.
 *
 * Security: secret VALUES never appear in logs, errors or serialized output — credentials hold material
 * in private fields and expose only masks; comparisons are constant-time; time and nonces are injected
 * so signing is deterministic. Foundations (OAuth2 refresh, RSA/ECDSA) are contracts that throw until a
 * concrete adapter is injected. No provider-specific credentials or schemes are implemented here.
 */
export * from './crypto';
export * from './secret';
export * from './credential';
export * from './errors';
export * from './signature';
export * from './nonce';
export * from './timestamp';
export * from './credential-manager';
export * from './token-manager';
export * from './api-key-manager';
export * from './validator';
export * from './rotation';
export * from './context';
export * from './metrics';
export * from './strategy';
export * from './service';
export * from './middleware';
