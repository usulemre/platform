import { FeatureDetailView } from '@/modules/feature-store';

/** Feature details page (Server Component). Params are async in Next 15. */
export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  return <FeatureDetailView featureId={featureId} />;
}
