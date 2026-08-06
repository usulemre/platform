import { RiskDetailView } from '@/modules/risk-engine';

/** Portfolio risk details page (admin, Server Component). Params are async in Next 15. */
export default async function RiskDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <RiskDetailView assessmentId={assessmentId} />;
}
