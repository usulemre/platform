import { SymbolDetailView } from '@/modules/market-data';

/** Symbol Details page (Server Component). Route params are async in Next 15. */
export default async function SymbolDetailPage({
  params,
}: {
  params: Promise<{ symbolId: string }>;
}) {
  const { symbolId } = await params;
  return <SymbolDetailView symbolId={symbolId} />;
}
