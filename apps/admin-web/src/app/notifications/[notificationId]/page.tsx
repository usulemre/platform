import { NotificationDetailView } from '@/modules/notification';

/** Notification Details page (Server Component). Params are async in Next 15. */
export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ notificationId: string }>;
}) {
  const { notificationId } = await params;
  return <NotificationDetailView notificationId={notificationId} />;
}
