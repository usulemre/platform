import { Skeleton } from '@platform/ui';

/** Risk loading state (list skeleton). */
export function RiskLoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading risk assessments">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
