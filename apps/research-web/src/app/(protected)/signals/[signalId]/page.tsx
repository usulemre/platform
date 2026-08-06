import { SignalDetailView } from '@/modules/signal';

/** Signal Details page (Server Component). Route params are async in Next 15. */
export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  return <SignalDetailView signalId={signalId} />;
}
