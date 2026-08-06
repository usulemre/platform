import { ExperimentDetailView } from '@/modules/experiment';

/** Experiment Details page (Server Component). Route params are async in Next 15. */
export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ experimentId: string }>;
}) {
  const { experimentId } = await params;
  return <ExperimentDetailView experimentId={experimentId} />;
}
