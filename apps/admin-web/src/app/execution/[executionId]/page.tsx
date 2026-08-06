import { ExecutionDetailView } from '@/modules/execution';

/** Execution detail page (Server Component). Params are async in Next 15. */
export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  return <ExecutionDetailView executionId={executionId} />;
}
