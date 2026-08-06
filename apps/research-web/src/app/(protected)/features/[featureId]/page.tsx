import { FeatureDetailView } from '@/modules/feature';

/** Feature Details page (Server Component). Route params are async in Next 15. */
export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureId: string }>;
}) {
  const { featureId } = await params;
  return <FeatureDetailView featureId={featureId} />;
}
