'use client';

import { Alert, Button } from '@platform/ui';

/** Portfolio error state. */
export function PortfolioErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load portfolios">
      <div className="space-y-2">
        <p>
          The portfolio service could not be reached. This is expected until the governed backend is
          available.
        </p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
