import { AgentDetailView } from '@/modules/agent';

/** Agent Details page (Server Component). Route params are async in Next 15. */
export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return <AgentDetailView agentId={agentId} />;
}
