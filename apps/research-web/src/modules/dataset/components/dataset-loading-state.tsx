import { Skeleton } from '@platform/ui';

/** Dataset loading state (list skeleton). */
export function DatasetLoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading datasets">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
