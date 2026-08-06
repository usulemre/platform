'use client';

import { RiskError } from '@/modules/risk-engine';

/** Route-level error state for the risk-engine admin segment. */
export default function RiskEngineErrorRoute({ reset }: { error: Error; reset: () => void }) {
  return <RiskError onRetry={reset} />;
}
