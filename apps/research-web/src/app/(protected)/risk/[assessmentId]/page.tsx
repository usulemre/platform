import { RiskAssessmentDetailView } from '@/modules/risk';

/** Risk Assessment Details page (Server Component). Params are async in Next 15. */
export default async function RiskAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return <RiskAssessmentDetailView assessmentId={assessmentId} />;
}
