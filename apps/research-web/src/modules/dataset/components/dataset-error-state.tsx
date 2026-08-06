'use client';

import { Alert, Button } from '@platform/ui';

/** Dataset error state. */
export function DatasetErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load datasets">
      <div className="space-y-2">
        <p>
          The dataset service could not be reached. This is expected until the governed backend is
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
