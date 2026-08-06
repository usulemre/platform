'use client';

import { Alert, Button } from '@platform/ui';

/** Signal error state. */
export function SignalErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load signals">
      <div className="space-y-2">
        <p>
          The signal service could not be reached. This is expected until the governed backend is
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
