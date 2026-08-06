import { SessionDetailView } from '@/modules/execution-simulator';

/** Simulation session details page (admin, Server Component). Params are async in Next 15. */
export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionDetailView sessionId={sessionId} />;
}
