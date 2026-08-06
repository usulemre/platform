import { RoutingDetailView } from '@/modules/smart-order-router';

/** Routing detail page (Server Component). Params are async in Next 15. */
export default async function RoutingDetailPage({
  params,
}: {
  params: Promise<{ routingId: string }>;
}) {
  const { routingId } = await params;
  return <RoutingDetailView routingId={routingId} />;
}
