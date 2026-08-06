/**
 * Market-data view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface AssetVm {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly assetClass: StatusVm;
}

export interface ExchangeVm {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly region: string;
  readonly timezone: string;
  readonly mic: string;
  readonly assetClasses: readonly string[];
}

export interface SymbolListItemVm {
  readonly id: string;
  readonly canonical: string;
  readonly native: string;
  readonly assetClass: StatusVm;
  readonly kind: string;
  readonly exchangeId: string;
}

export interface CoverageVm {
  readonly status: StatusVm;
  readonly completeness: string;
  readonly gaps: number;
  readonly range: string;
}

export interface QualityVm {
  readonly grade: StatusVm;
  readonly completeness: string;
  readonly validity: string;
  readonly checkedLabel?: string;
}

export interface VersionVm {
  readonly version: string;
  readonly createdLabel: string;
  readonly note: string;
  readonly rows: string;
}

export interface TimeSeriesVm {
  readonly datasetId: string;
  readonly marketDataType: string;
  readonly timeframe: string;
  readonly range: string;
  readonly points: string;
}

export interface DatasetListItemVm {
  readonly id: string;
  readonly name: string;
  readonly marketDataType: StatusVm;
  readonly assetClass: StatusVm;
  readonly status: StatusVm;
  readonly coverage: StatusVm;
  readonly quality: StatusVm;
  readonly updatedLabel: string;
}

export interface SymbolDetailVm {
  readonly id: string;
  readonly canonical: string;
  readonly assetClass: StatusVm;
  readonly kind: string;
  readonly metadata: readonly MetadataRowVm[];
  readonly aliases: readonly string[];
}

export interface DatasetDetailVm {
  readonly id: string;
  readonly name: string;
  readonly marketDataType: StatusVm;
  readonly assetClass: StatusVm;
  readonly status: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly coverage: CoverageVm;
  readonly quality: QualityVm;
  readonly versions: readonly VersionVm[];
  readonly extra: readonly MetadataRowVm[];
}

export interface SessionVm {
  readonly id: string;
  readonly exchangeId: string;
  readonly name: string;
  readonly hours: string;
  readonly timezone: string;
  readonly state: StatusVm;
  readonly days: string;
}

export interface MarketEventVm {
  readonly id: string;
  readonly exchangeId: string;
  readonly type: StatusVm;
  readonly label: string;
  readonly dateLabel: string;
}

export interface HolidayCalendarVm {
  readonly id: string;
  readonly exchangeId: string;
  readonly name: string;
  readonly holidays: readonly { readonly date: string; readonly name: string }[];
}

export interface CatalogEntryVm {
  readonly datasetId: string;
  readonly name: string;
  readonly marketDataType: StatusVm;
  readonly assetClass: StatusVm;
  readonly status: StatusVm;
  readonly latestVersion: string;
}

export interface CoverageRowVm {
  readonly datasetId: string;
  readonly name: string;
  readonly status: StatusVm;
  readonly completeness: string;
  readonly range: string;
}

export interface QualityRowVm {
  readonly datasetId: string;
  readonly name: string;
  readonly grade: StatusVm;
  readonly completeness: string;
  readonly validity: string;
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface MarketDataSummaryVm {
  readonly assets: number;
  readonly exchanges: number;
  readonly symbols: number;
  readonly datasets: number;
  readonly byAssetClass: readonly SummaryBucketVm[];
  readonly byMarketDataType: readonly SummaryBucketVm[];
}
