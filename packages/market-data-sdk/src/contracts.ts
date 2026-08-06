/**
 * Canonical market-data contracts — the shared, transport-agnostic models the
 * market-data service and its administration UI both speak. Inert data only; no
 * exchange-specific logic, no provider fields, no secrets.
 */
import type { AssetClass } from './asset-classes';
import type { MarketDataType } from './market-data-types';
import type { CoverageStatus, DatasetStatus, QualityGrade, SessionState } from './statuses';
import type { Timeframe } from './timeframes';

export type InstrumentKind = 'SPOT' | 'PERP' | 'FUTURE' | 'OPTION' | 'INDEX' | 'CASH';
export type OptionType = 'CALL' | 'PUT';

export interface Currency {
  readonly code: string;
  readonly name: string;
}

export interface Asset {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly assetClass: AssetClass;
}

export interface Exchange {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly region: string;
  readonly timezone: string;
  readonly mic?: string;
  readonly assetClasses: readonly AssetClass[];
}

export interface Market {
  readonly id: string;
  readonly exchangeId: string;
  readonly name: string;
  readonly kind: InstrumentKind;
}

export interface TradingPair {
  readonly id: string;
  readonly base: string;
  readonly quote: string;
}

export interface Instrument {
  readonly id: string;
  readonly symbol: string;
  readonly assetClass: AssetClass;
  readonly exchangeId: string;
  readonly kind: InstrumentKind;
}

export interface Contract {
  readonly id: string;
  readonly instrumentId: string;
  readonly expiry?: string;
  readonly strike?: number;
  readonly optionType?: OptionType;
}

/** A canonical symbol registry entry with its native aliases. */
export interface SymbolRecord {
  readonly id: string;
  readonly canonical: string;
  readonly native: string;
  readonly assetClass: AssetClass;
  readonly exchangeId: string;
  readonly kind: InstrumentKind;
  readonly base?: string;
  readonly quote?: string;
  readonly aliases: readonly string[];
}

export interface CoverageInfo {
  readonly status: CoverageStatus;
  readonly startAt?: string;
  readonly endAt?: string;
  readonly completeness: number;
  readonly gaps: number;
}

export interface QualityInfo {
  readonly grade: QualityGrade;
  readonly completeness: number;
  readonly validity: number;
  readonly checkedAt?: string;
}

export interface DatasetVersion {
  readonly version: string;
  readonly createdAt: string;
  readonly note: string;
  readonly rows: string;
}

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface Dataset {
  readonly id: string;
  readonly name: string;
  readonly marketDataType: MarketDataType;
  readonly assetClass: AssetClass;
  readonly exchangeId: string;
  readonly symbolId?: string;
  readonly timeframe?: Timeframe;
  readonly status: DatasetStatus;
  readonly version: string;
  readonly ingestionRef: string;
  readonly coverage: CoverageInfo;
  readonly quality: QualityInfo;
  readonly versions: readonly DatasetVersion[];
  readonly metadata: readonly MetadataEntry[];
  readonly updatedAt: string;
}

/** A retrievable time-series reference (metadata only — never the data). */
export interface TimeSeriesRef {
  readonly datasetId: string;
  readonly symbolId: string;
  readonly marketDataType: MarketDataType;
  readonly timeframe: Timeframe;
  readonly startAt: string;
  readonly endAt: string;
  readonly points: string;
}

export type MarketEventType =
  | 'HOLIDAY'
  | 'HALF_DAY'
  | 'HALT'
  | 'MAINTENANCE'
  | 'LISTING'
  | 'DELISTING';

export interface MarketEvent {
  readonly id: string;
  readonly exchangeId: string;
  readonly type: MarketEventType;
  readonly label: string;
  readonly date: string;
}

export interface TradingSession {
  readonly id: string;
  readonly exchangeId: string;
  readonly name: string;
  readonly open: string;
  readonly close: string;
  readonly timezone: string;
  readonly state: SessionState;
  readonly days: readonly string[];
}

export interface HolidayCalendar {
  readonly id: string;
  readonly exchangeId: string;
  readonly name: string;
  readonly holidays: readonly { readonly date: string; readonly name: string }[];
}
