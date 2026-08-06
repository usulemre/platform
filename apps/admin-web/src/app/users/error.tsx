'use client';

import { UmError } from '@/modules/user-management';

/** Route-level error state for the users segment. */
export default function UsersError({ reset }: { error: Error; reset: () => void }) {
  return <UmError onRetry={reset} />;
}
