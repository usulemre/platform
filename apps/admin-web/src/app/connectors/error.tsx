'use client';

import { ConnectorError } from '@/modules/connector';

/** Route-level error state for the connectors segment. */
export default function ConnectorsError({ reset }: { error: Error; reset: () => void }) {
  return <ConnectorError onRetry={reset} />;
}
