'use client';

import { Alert, Button } from '@platform/ui';

/** Strategy error state. */
export function StrategyErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load strategies">
      <div className="space-y-2">
        <p>
          The strategy service could not be reached. This is expected until the governed backend is
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
