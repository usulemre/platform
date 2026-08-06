'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useNotification } from '../hooks/use-notifications';
import {
  CategoryBadge,
  InfoCard,
  KeyValueList,
  NotificationBadge,
  NotificationEmpty,
  NotificationError,
  NotificationLoading,
} from './notification-atoms';

/** Notification details container. Shows the body, priority/status/delivery, the
 *  summary and metadata. Read-only (status is asserted by the backend). */
export function NotificationDetailView({ notificationId }: { notificationId: string }) {
  const { data, isLoading, isError, refetch } = useNotification(notificationId);

  if (isLoading) return <NotificationLoading />;
  if (isError) return <NotificationError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/notifications/inbox">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <NotificationEmpty label="No notification matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to inbox">
          <Link href="/notifications/inbox">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
        <CategoryBadge label={data.categoryLabel} />
        <NotificationBadge label={data.priority.label} tone={data.priority.tone} />
        <NotificationBadge label={data.status.label} tone={data.status.tone} />
        <NotificationBadge label={data.delivery.label} tone={data.delivery.tone} />
      </div>

      <p className="max-w-prose text-muted-foreground">{data.body}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Details">
          <KeyValueList rows={data.summary} />
        </InfoCard>
        <InfoCard title="Metadata">
          {data.metadata.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional metadata.</p>
          ) : (
            <KeyValueList rows={data.metadata} />
          )}
        </InfoCard>
      </div>
    </div>
  );
}
