'use client';

import { Alert, Button } from '@platform/ui';

/** Feature error state. */
export function FeatureErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load features">
      <div className="space-y-2">
        <p>
          The feature service could not be reached. This is expected until the governed backend is
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
