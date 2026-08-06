import { ConnectorDetailView } from '@/modules/connector';

/** Connector Details page (Server Component). Route params are async in Next 15. */
export default async function ConnectorDetailPage({
  params,
}: {
  params: Promise<{ connectorId: string }>;
}) {
  const { connectorId } = await params;
  return <ConnectorDetailView connectorId={connectorId} />;
}
