import { Suspense, type ReactNode } from 'react';
import { Spinner } from '@platform/ui';

/** Default full-region loading indicator. */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
      <Spinner />
      Loading…
    </div>
  );
}

/** Suspense wrapper with a shared default fallback. */
export function LoadingBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback ?? <PageLoader />}>{children}</Suspense>;
}
