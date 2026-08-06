import { OrderDetailView } from '@/modules/orders';

/** Order detail page (Server Component). Params are async in Next 15. */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
