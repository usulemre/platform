import { Skeleton } from '@platform/ui';

/** Execution loading state (queue skeleton). */
export function ExecutionLoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading execution requests">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
