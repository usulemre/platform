import { RiskLoading } from '@/modules/risk-engine';

/** Route-level loading state for the Risk Engine admin console. */
export default function RiskEngineLoadingRoute() {
  return <RiskLoading rows={6} />;
}
