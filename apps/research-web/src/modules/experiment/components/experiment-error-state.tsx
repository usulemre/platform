'use client';

import { Alert, Button } from '@platform/ui';

/** Experiment error state. */
export function ExperimentErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load experiments">
      <div className="space-y-2">
        <p>
          The experiment service could not be reached. This is expected until the governed backend
          is available.
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
