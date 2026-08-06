'use client';

import { Alert, Button } from '@platform/ui';

/** Execution error state. */
export function ExecutionErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load execution requests">
      <div className="space-y-2">
        <p>
          The execution service could not be reached. This is expected until the governed backend is
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
