'use client';

import { NotificationError } from '@/modules/notification';

/** Route-level error state for the notifications segment. */
export default function NotificationsError({ reset }: { error: Error; reset: () => void }) {
  return <NotificationError onRetry={reset} />;
}
