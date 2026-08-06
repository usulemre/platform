import { ReportDetailView } from '@/modules/performance-analytics';

/** Performance report details page (admin, Server Component). Params are async in Next 15. */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportDetailView reportId={reportId} />;
}
