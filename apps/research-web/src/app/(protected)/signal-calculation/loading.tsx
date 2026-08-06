import { SigLoading } from '@/modules/signal-calculation';

/** Route-level loading state for the Signal Calculation Engine. */
export default function SignalCalculationLoadingRoute() {
  return <SigLoading rows={6} />;
}
