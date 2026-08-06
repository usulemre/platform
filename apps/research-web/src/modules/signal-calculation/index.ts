/**
 * Signal Calculation module (v1, research-web) — the module's public surface for research-web's
 * routing layer. Only container components are exported; the domain, data and application layers are
 * internal. The data layer runs the REAL signal-calculation SDK to produce live results.
 */
export { SignalCalculationDashboard } from './components/signal-calculation-dashboard';
export { SignalExplorer } from './components/signal-explorer';
export { SignalDebugger } from './components/signal-debugger';
export { SignalBenchmark } from './components/signal-benchmark';
export { SignalComparison } from './components/signal-comparison';
export {
  ExecutionTimeline,
  ExecutionStatus,
  PerformanceOverview,
} from './components/execution-views';
export { SigLoading, SigError } from './components/signal-calculation-atoms';
