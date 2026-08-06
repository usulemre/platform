'use client';

import { RouteError } from '@platform/shell';

/** Route-level error boundary for the protected area. */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} />;
}
