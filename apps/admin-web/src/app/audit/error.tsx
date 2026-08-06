'use client';

import { AuditError } from '@/modules/audit';

/** Route-level error state for the audit segment. */
export default function AuditErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <AuditError onRetry={reset} />;
}
