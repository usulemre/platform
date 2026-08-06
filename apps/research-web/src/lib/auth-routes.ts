/**
 * Route-protection table for research-web, consumed by the edge middleware and
 * the server layouts. Declarative and technology-neutral; the guard decision
 * logic lives in `@platform/auth`.
 */
import type { RouteRule } from '@platform/auth';

export const authRoutes: RouteRule[] = [
  { prefix: '/login', access: 'public' },
  { prefix: '/dashboard', access: 'protected' },
  { prefix: '/', access: 'protected' },
];
