import { Skeleton } from '@platform/ui';

/** Experiment loading state (list skeleton). */
export function ExperimentLoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading experiments">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
