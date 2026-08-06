'use client';

import { OrdError } from '@/modules/orders';

/** Route-level error state for the OMS console. */
export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return <OrdError onRetry={reset} />;
}
