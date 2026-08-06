import { PipelineDetailView } from '@/modules/data-ingestion';

/** Pipeline Details page (Server Component). Route params are async in Next 15. */
export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  return <PipelineDetailView pipelineId={pipelineId} />;
}
