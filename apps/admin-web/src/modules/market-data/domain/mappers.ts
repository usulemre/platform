/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Labels come from the shared `@platform/market-data-sdk`.
 */
import {
  ASSET_CLASSES,
  assetClassLabel,
  describeTimeframe,
  marketDataTypeLabel,
  MARKET_DATA_TYPES,
  type Asset,
  type AssetClass,
  type CoverageStatus,
  type Dataset,
  type DatasetStatus,
  type DatasetVersion,
  type Exchange,
  type HolidayCalendar,
  type MarketDataType,
  type MarketEvent,
  type MarketEventType,
  type QualityGrade,
  type SessionState,
  type SymbolRecord,
  type TimeSeriesRef,
  type TradingSession,
} from '@platform/market-data-sdk';
import type {
  AssetVm,
  CatalogEntryVm,
  CoverageRowVm,
  CoverageVm,
  DatasetDetailVm,
  DatasetListItemVm,
  ExchangeVm,
  HolidayCalendarVm,
  MarketDataSummaryVm,
  MarketEventVm,
  QualityRowVm,
  QualityVm,
  SessionVm,
  StatusVm,
  SummaryBucketVm,
  SymbolDetailVm,
  SymbolListItemVm,
  TimeSeriesVm,
  Tone,
  VersionVm,
} from './view-model';

const DATASET_STATUS_LABEL: Record<DatasetStatus, string> = {
  ACTIVE: 'Active',
  STALE: 'Stale',
  EMPTY: 'Empty',
  DEPRECATED: 'Deprecated',
};
const DATASET_STATUS_TONE: Record<DatasetStatus, Tone> = {
  ACTIVE: 'positive',
  STALE: 'warning',
  EMPTY: 'neutral',
  DEPRECATED: 'neutral',
};

const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  COMPLETE: 'Complete',
  PARTIAL: 'Partial',
  SPARSE: 'Sparse',
  MISSING: 'Missing',
};
const COVERAGE_TONE: Record<CoverageStatus, Tone> = {
  COMPLETE: 'positive',
  PARTIAL: 'warning',
  SPARSE: 'warning',
  MISSING: 'danger',
};

const QUALITY_LABEL: Record<QualityGrade, string> = { PASS: 'Pass', WARN: 'Warn', FAIL: 'Fail' };
const QUALITY_TONE: Record<QualityGrade, Tone> = {
  PASS: 'positive',
  WARN: 'warning',
  FAIL: 'danger',
};

const SESSION_LABEL: Record<SessionState, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  PRE_MARKET: 'Pre-market',
  POST_MARKET: 'Post-market',
  HOLIDAY: 'Holiday',
};
const SESSION_TONE: Record<SessionState, Tone> = {
  OPEN: 'positive',
  CLOSED: 'neutral',
  PRE_MARKET: 'info',
  POST_MARKET: 'info',
  HOLIDAY: 'warning',
};

const EVENT_LABEL: Record<MarketEventType, string> = {
  HOLIDAY: 'Holiday',
  HALF_DAY: 'Half day',
  HALT: 'Halt',
  MAINTENANCE: 'Maintenance',
  LISTING: 'Listing',
  DELISTING: 'Delisting',
};
const EVENT_TONE: Record<MarketEventType, Tone> = {
  HOLIDAY: 'warning',
  HALF_DAY: 'info',
  HALT: 'danger',
  MAINTENANCE: 'warning',
  LISTING: 'positive',
  DELISTING: 'neutral',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function assetClassVm(assetClass: AssetClass): StatusVm {
  return { value: assetClass, label: assetClassLabel(assetClass), tone: 'info' };
}

function marketDataTypeVm(type: MarketDataType): StatusVm {
  return { value: type, label: marketDataTypeLabel(type), tone: 'info' };
}

function datasetStatusVm(status: DatasetStatus): StatusVm {
  return { value: status, label: DATASET_STATUS_LABEL[status], tone: DATASET_STATUS_TONE[status] };
}

function coverageStatusVm(status: CoverageStatus): StatusVm {
  return { value: status, label: COVERAGE_LABEL[status], tone: COVERAGE_TONE[status] };
}

function qualityVm(grade: QualityGrade): StatusVm {
  return { value: grade, label: QUALITY_LABEL[grade], tone: QUALITY_TONE[grade] };
}

function rangeLabel(startAt?: string, endAt?: string): string {
  if (!startAt || !endAt) return 'No data';
  return `${dateLabel(startAt)} → ${dateLabel(endAt)}`;
}

export function toAssetVm(asset: Asset): AssetVm {
  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    assetClass: assetClassVm(asset.assetClass),
  };
}

export function toExchangeVm(exchange: Exchange): ExchangeVm {
  return {
    id: exchange.id,
    code: exchange.code,
    name: exchange.name,
    region: exchange.region,
    timezone: exchange.timezone,
    mic: exchange.mic ?? '—',
    assetClasses: exchange.assetClasses.map(assetClassLabel),
  };
}

export function toSymbolListItemVm(symbol: SymbolRecord): SymbolListItemVm {
  return {
    id: symbol.id,
    canonical: symbol.canonical,
    native: symbol.native,
    assetClass: assetClassVm(symbol.assetClass),
    kind: symbol.kind,
    exchangeId: symbol.exchangeId,
  };
}

export function toSymbolDetailVm(symbol: SymbolRecord): SymbolDetailVm {
  return {
    id: symbol.id,
    canonical: symbol.canonical,
    assetClass: assetClassVm(symbol.assetClass),
    kind: symbol.kind,
    metadata: [
      { label: 'Canonical', value: symbol.canonical },
      { label: 'Native', value: symbol.native },
      { label: 'Kind', value: symbol.kind },
      { label: 'Base', value: symbol.base ?? '—' },
      { label: 'Quote', value: symbol.quote ?? '—' },
      { label: 'Exchange', value: symbol.exchangeId },
    ],
    aliases: symbol.aliases,
  };
}

export function toDatasetListItemVm(dataset: Dataset): DatasetListItemVm {
  return {
    id: dataset.id,
    name: dataset.name,
    marketDataType: marketDataTypeVm(dataset.marketDataType),
    assetClass: assetClassVm(dataset.assetClass),
    status: datasetStatusVm(dataset.status),
    coverage: coverageStatusVm(dataset.coverage.status),
    quality: qualityVm(dataset.quality.grade),
    updatedLabel: dateLabel(dataset.updatedAt),
  };
}

function toCoverageVm(dataset: Dataset): CoverageVm {
  return {
    status: coverageStatusVm(dataset.coverage.status),
    completeness: pct(dataset.coverage.completeness),
    gaps: dataset.coverage.gaps,
    range: rangeLabel(dataset.coverage.startAt, dataset.coverage.endAt),
  };
}

function toQualityVm(dataset: Dataset): QualityVm {
  return {
    grade: qualityVm(dataset.quality.grade),
    completeness: pct(dataset.quality.completeness),
    validity: pct(dataset.quality.validity),
    checkedLabel: dataset.quality.checkedAt ? dateLabel(dataset.quality.checkedAt) : undefined,
  };
}

export function toVersionVm(version: DatasetVersion): VersionVm {
  return {
    version: version.version,
    createdLabel: dateLabel(version.createdAt),
    note: version.note,
    rows: version.rows,
  };
}

export function toDatasetDetailVm(dataset: Dataset): DatasetDetailVm {
  return {
    id: dataset.id,
    name: dataset.name,
    marketDataType: marketDataTypeVm(dataset.marketDataType),
    assetClass: assetClassVm(dataset.assetClass),
    status: datasetStatusVm(dataset.status),
    metadata: [
      { label: 'Market data type', value: marketDataTypeLabel(dataset.marketDataType) },
      { label: 'Asset class', value: assetClassLabel(dataset.assetClass) },
      { label: 'Exchange', value: dataset.exchangeId },
      { label: 'Symbol', value: dataset.symbolId ?? '—' },
      {
        label: 'Timeframe',
        value: dataset.timeframe ? describeTimeframe(dataset.timeframe).label : '—',
      },
      { label: 'Ingestion source', value: dataset.ingestionRef },
      { label: 'Version', value: dataset.version },
      { label: 'Updated', value: dateLabel(dataset.updatedAt) },
    ],
    coverage: toCoverageVm(dataset),
    quality: toQualityVm(dataset),
    versions: dataset.versions.map(toVersionVm),
    extra: dataset.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
  };
}

export function toTimeSeriesVm(series: TimeSeriesRef): TimeSeriesVm {
  return {
    datasetId: series.datasetId,
    marketDataType: marketDataTypeLabel(series.marketDataType),
    timeframe: describeTimeframe(series.timeframe).label,
    range: rangeLabel(series.startAt, series.endAt),
    points: series.points,
  };
}

export function toSessionVm(session: TradingSession): SessionVm {
  return {
    id: session.id,
    exchangeId: session.exchangeId,
    name: session.name,
    hours: `${session.open}–${session.close}`,
    timezone: session.timezone,
    state: {
      value: session.state,
      label: SESSION_LABEL[session.state],
      tone: SESSION_TONE[session.state],
    },
    days: session.days.join(', '),
  };
}

export function toMarketEventVm(event: MarketEvent): MarketEventVm {
  return {
    id: event.id,
    exchangeId: event.exchangeId,
    type: { value: event.type, label: EVENT_LABEL[event.type], tone: EVENT_TONE[event.type] },
    label: event.label,
    dateLabel: event.date,
  };
}

export function toHolidayCalendarVm(calendar: HolidayCalendar): HolidayCalendarVm {
  return {
    id: calendar.id,
    exchangeId: calendar.exchangeId,
    name: calendar.name,
    holidays: calendar.holidays,
  };
}

export function toCatalogEntryVm(dataset: Dataset, latestVersion: string): CatalogEntryVm {
  return {
    datasetId: dataset.id,
    name: dataset.name,
    marketDataType: marketDataTypeVm(dataset.marketDataType),
    assetClass: assetClassVm(dataset.assetClass),
    status: datasetStatusVm(dataset.status),
    latestVersion,
  };
}

export function toCoverageRowVm(dataset: Dataset): CoverageRowVm {
  return {
    datasetId: dataset.id,
    name: dataset.name,
    status: coverageStatusVm(dataset.coverage.status),
    completeness: pct(dataset.coverage.completeness),
    range: rangeLabel(dataset.coverage.startAt, dataset.coverage.endAt),
  };
}

export function toQualityRowVm(dataset: Dataset): QualityRowVm {
  return {
    datasetId: dataset.id,
    name: dataset.name,
    grade: qualityVm(dataset.quality.grade),
    completeness: pct(dataset.quality.completeness),
    validity: pct(dataset.quality.validity),
  };
}

export function toSummaryVm(
  assets: readonly Asset[],
  exchanges: readonly Exchange[],
  symbols: readonly SymbolRecord[],
  datasets: readonly Dataset[],
): MarketDataSummaryVm {
  const countSymbolClass = (assetClass: AssetClass): number =>
    symbols.filter((s) => s.assetClass === assetClass).length;
  const countDatasetType = (type: MarketDataType): number =>
    datasets.filter((d) => d.marketDataType === type).length;

  const byAssetClass: SummaryBucketVm[] = ASSET_CLASSES.map((assetClass) => ({
    value: assetClass,
    label: assetClassLabel(assetClass),
    count: countSymbolClass(assetClass),
    tone: 'info' as Tone,
  })).filter((bucket) => bucket.count > 0);

  const byMarketDataType: SummaryBucketVm[] = MARKET_DATA_TYPES.map((type) => ({
    value: type,
    label: marketDataTypeLabel(type),
    count: countDatasetType(type),
    tone: 'info' as Tone,
  })).filter((bucket) => bucket.count > 0);

  return {
    assets: assets.length,
    exchanges: exchanges.length,
    symbols: symbols.length,
    datasets: datasets.length,
    byAssetClass,
    byMarketDataType,
  };
}
