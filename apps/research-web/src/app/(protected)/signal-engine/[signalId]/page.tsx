import { SignalDetailView } from '@/modules/signal-engine';

/** Signal details page (Server Component). Params are async in Next 15. */
export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  return <SignalDetailView signalId={signalId} />;
}
