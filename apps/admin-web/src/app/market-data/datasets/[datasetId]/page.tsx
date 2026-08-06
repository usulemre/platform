import { DatasetDetailView } from '@/modules/market-data';

/** Dataset Details page (Server Component). Route params are async in Next 15. */
export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;
  return <DatasetDetailView datasetId={datasetId} />;
}
