import { DeploymentDetailView } from '@/modules/live-trading';

/** Deployment details page (admin, Server Component). Params are async in Next 15. */
export default async function DeploymentDetailPage({
  params,
}: {
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = await params;
  return <DeploymentDetailView deploymentId={deploymentId} />;
}
