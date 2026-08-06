import { Skeleton } from '@platform/ui';

/** Portfolio loading state (catalog skeleton). */
export function PortfolioLoadingState() {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading portfolios"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}
