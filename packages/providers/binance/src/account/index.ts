/**
 * `@platform/provider-binance/account` — the Binance Position & Balance Synchronization module (Phase
 * 9.1.6): the canonical account-state synchronization layer. It retrieves, maintains, reconciles and
 * publishes canonical balances, positions, account status and permissions by combining an initial REST
 * snapshot with incremental user-data events, driven by a synchronization state machine with explicit
 * snapshot recovery. It exposes ONLY canonical models and reads only — no order placement, no trading
 * strategy, portfolio or risk logic. Spot and Futures account models are handled distinctly.
 */
export * from './canonical';
export {
  SynchronizationStateMachine,
  type SyncStateChange,
  type SyncStateListener,
} from './state-machine';
export { SequenceValidator, type SequenceDecision, type SequenceInput } from './sequence-validator';
export {
  BinanceRestAccountClient,
  BinanceRestBalanceClient,
  BinanceRestPositionClient,
  type BinanceAccountClient,
  type BinanceBalanceClient,
  type BinancePositionClient,
} from './clients';
export { AccountMapper, BalanceMapper, PositionMapper } from './mappers';
export { AccountValidator, BalanceValidator, PositionValidator } from './validators';
export { AccountErrorMapper } from './error-mapper';
export {
  BinanceAccountService,
  BinanceBalanceService,
  BinancePositionService,
  type BinanceAccountServiceDeps,
} from './services';
export { AccountSnapshotManager, type AccountSnapshotManagerDeps } from './snapshot-manager';
export { BinanceBalanceSynchronizer } from './balance-synchronizer';
export { BinancePositionSynchronizer } from './position-synchronizer';
export {
  EventProcessor,
  type IncrementalAccountEvent,
  type ProcessResult,
  type EventProcessorDeps,
} from './event-processor';
export { StateReconciler, type ConsistencyReport } from './reconciler';
export { SyncMetrics, type SyncMetricsSnapshot } from './metrics';
export {
  BinanceAccountSynchronizer,
  type BinanceAccountSynchronizerDeps,
  type AccountEventSource,
} from './account-synchronizer';
