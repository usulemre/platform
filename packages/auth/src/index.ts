/**
 * @platform/auth — authentication & authorization for the platform frontend.
 *
 * This root entry is PURE and edge-safe (no React): models, the session state
 * machine, permission predicates, the Validation-Foundation integration, the
 * framework-neutral route guard, the transport client, and the UI-state store.
 * The React layer (providers/hooks) is published separately at
 * `@platform/auth/react` so this entry stays usable in middleware and Server
 * Components.
 *
 * Boundaries: NOT an external identity provider; NO protocol; NO secrets.
 */
export * from './model';
export * from './session';
export * from './permissions';
export * from './validation';
export * from './guard';
export * from './client';
export * from './store';
export * from './iam';
