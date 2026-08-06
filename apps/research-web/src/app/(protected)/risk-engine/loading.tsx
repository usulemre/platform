import { RiskLoading } from '@/modules/risk-engine';

/** Route-level loading state for the Risk Engine. */
export default function RiskEngineLoadingRoute() {
  return <RiskLoading rows={6} />;
}
