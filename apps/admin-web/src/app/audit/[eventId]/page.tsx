import { EventDetailView } from '@/modules/audit';

/** Audit Event Details page (Server Component). Params are async in Next 15. */
export default async function AuditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventDetailView eventId={eventId} />;
}
