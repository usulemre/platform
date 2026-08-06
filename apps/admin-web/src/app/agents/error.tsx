'use client';

import { AgentError } from '@/modules/agent';

/** Route-level error state for the agents segment. */
export default function AgentsError({ reset }: { error: Error; reset: () => void }) {
  return <AgentError onRetry={reset} />;
}
