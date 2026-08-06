import type { Metadata } from 'next';
import { Unauthorized } from '@platform/auth/react';

export const metadata: Metadata = {
  title: 'Access denied · Research Platform',
};

/** Unauthorized (403) page. Rendered when an authenticated user lacks access to
 *  a resource. Uses the shared, framework-independent Unauthorized surface. */
export default function UnauthorizedPage() {
  return <Unauthorized homeHref="/dashboard" homeLabel="Back to dashboard" />;
}
