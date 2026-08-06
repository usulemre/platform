/**
 * Market-data admin DTOs. The canonical shapes are owned by the shared
 * `@platform/market-data-sdk` (single source of truth across the service and this
 * UI); this module re-exports them so the admin tier speaks the same vocabulary.
 * Inert data only — no transport, no exchange-specific logic.
 */
export type {
  Asset,
  AssetClass,
  CoverageStatus,
  Currency,
  Dataset,
  DatasetStatus,
  DatasetVersion,
  Exchange,
  HolidayCalendar,
  InstrumentKind,
  MarketDataType,
  MarketEvent,
  MarketEventType,
  MetadataEntry,
  QualityGrade,
  SessionState,
  SymbolRecord,
  Timeframe,
  TimeSeriesRef,
  TradingSession,
} from '@platform/market-data-sdk';
