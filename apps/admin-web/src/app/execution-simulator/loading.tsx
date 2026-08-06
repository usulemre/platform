import { ExecutionLoading } from '@/modules/execution-simulator';

/** Route-level loading state for the Execution Simulator admin console. */
export default function ExecutionSimulatorLoadingRoute() {
  return <ExecutionLoading rows={6} />;
}
