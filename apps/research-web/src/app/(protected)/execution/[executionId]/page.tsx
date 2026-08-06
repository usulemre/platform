import { ExecutionDetailView } from '@/modules/execution';

/** Execution Details page (Server Component). Route params are async in Next 15. */
export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  return <ExecutionDetailView executionId={executionId} />;
}
