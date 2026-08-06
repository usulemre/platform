/**
 * The canonical **provider catalog** — the reference descriptors for every supported broker/venue
 * provider. These are inert placeholders: they declare each provider's kind, transport family, asset
 * classes and the subset of capability contracts it exposes, but contain NO implementation — no
 * exchange REST call, no WebSocket protocol, no FIX message. Concrete provider adapters live in the
 * `@platform/providers/*` packages and are injected into the gateway registry; nothing here connects.
 */
import { CAPABILITY_TYPES, type BrokerCapabilityType } from './capabilities';

export type ProviderId =
  | 'binance'
  | 'binance-futures'
  | 'hyperliquid'
  | 'deribit'
  | 'interactive-brokers'
  | 'alpaca'
  | 'bist'
  | 'fix'
  | 'rest'
  | 'websocket';

/** The kind of venue/provider. */
export type ProviderKind =
  | 'CRYPTO_EXCHANGE'
  | 'DERIVATIVES_EXCHANGE'
  | 'STOCK_BROKER'
  | 'STOCK_EXCHANGE'
  | 'PROTOCOL'
  | 'GENERIC';

/** The transport family (declared only — the transport itself is NOT implemented here). */
export type ProviderTransport = 'REST' | 'WEBSOCKET' | 'FIX' | 'HYBRID';

export type AssetClass = 'CRYPTO' | 'CRYPTO_PERP' | 'EQUITY' | 'OPTION' | 'FUTURE' | 'FX' | 'MULTI';

export interface ProviderDescriptor {
  readonly id: ProviderId;
  readonly name: string;
  readonly kind: ProviderKind;
  readonly transport: ProviderTransport;
  readonly assetClasses: readonly AssetClass[];
  readonly capabilities: readonly BrokerCapabilityType[];
  /** The npm package that supplies the (placeholder) adapter. */
  readonly packageName: string;
  /** Always true in v1 — no provider has a live implementation. */
  readonly placeholder: boolean;
}

const ALL = CAPABILITY_TYPES;
const TRADING_READ: readonly BrokerCapabilityType[] = [
  'SUBMIT_ORDER',
  'CANCEL_ORDER',
  'REPLACE_ORDER',
  'QUERY_ORDER',
  'QUERY_POSITIONS',
  'QUERY_BALANCES',
  'ACCOUNT_INFORMATION',
  'HEARTBEAT',
];

export const PROVIDER_CATALOG: readonly ProviderDescriptor[] = [
  {
    id: 'binance',
    name: 'Binance',
    kind: 'CRYPTO_EXCHANGE',
    transport: 'HYBRID',
    assetClasses: ['CRYPTO'],
    capabilities: ALL,
    packageName: '@platform/provider-binance',
    placeholder: true,
  },
  {
    id: 'binance-futures',
    name: 'Binance Futures',
    kind: 'DERIVATIVES_EXCHANGE',
    transport: 'HYBRID',
    assetClasses: ['CRYPTO_PERP', 'FUTURE'],
    capabilities: ALL,
    packageName: '@platform/provider-binance',
    placeholder: true,
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    kind: 'DERIVATIVES_EXCHANGE',
    transport: 'WEBSOCKET',
    assetClasses: ['CRYPTO_PERP'],
    capabilities: ALL,
    packageName: '@platform/provider-hyperliquid',
    placeholder: true,
  },
  {
    id: 'deribit',
    name: 'Deribit',
    kind: 'DERIVATIVES_EXCHANGE',
    transport: 'HYBRID',
    assetClasses: ['OPTION', 'FUTURE', 'CRYPTO_PERP'],
    capabilities: ALL,
    packageName: '@platform/provider-deribit',
    placeholder: true,
  },
  {
    id: 'interactive-brokers',
    name: 'Interactive Brokers',
    kind: 'STOCK_BROKER',
    transport: 'FIX',
    assetClasses: ['EQUITY', 'OPTION', 'FUTURE', 'FX'],
    capabilities: ALL,
    packageName: '@platform/provider-interactive-brokers',
    placeholder: true,
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    kind: 'STOCK_BROKER',
    transport: 'REST',
    assetClasses: ['EQUITY', 'CRYPTO'],
    capabilities: TRADING_READ.concat(['MARKET_DATA_SUBSCRIPTION', 'HISTORICAL_DATA']),
    packageName: '@platform/provider-alpaca',
    placeholder: true,
  },
  {
    id: 'bist',
    name: 'Borsa İstanbul (BIST)',
    kind: 'STOCK_EXCHANGE',
    transport: 'FIX',
    assetClasses: ['EQUITY'],
    capabilities: TRADING_READ,
    packageName: '@platform/provider-bist',
    placeholder: true,
  },
  {
    id: 'fix',
    name: 'Generic FIX provider',
    kind: 'PROTOCOL',
    transport: 'FIX',
    assetClasses: ['MULTI'],
    capabilities: TRADING_READ,
    packageName: '@platform/provider-fix',
    placeholder: true,
  },
  {
    id: 'rest',
    name: 'Generic REST broker',
    kind: 'GENERIC',
    transport: 'REST',
    assetClasses: ['MULTI'],
    capabilities: ALL,
    packageName: '@platform/provider-rest',
    placeholder: true,
  },
  {
    id: 'websocket',
    name: 'Generic WebSocket broker',
    kind: 'GENERIC',
    transport: 'WEBSOCKET',
    assetClasses: ['MULTI'],
    capabilities: ALL,
    packageName: '@platform/provider-websocket',
    placeholder: true,
  },
];

export const PROVIDER_IDS: readonly ProviderId[] = PROVIDER_CATALOG.map((p) => p.id);

const PROVIDER_BY_ID = new Map(PROVIDER_CATALOG.map((p) => [p.id, p] as const));

export function describeProvider(id: ProviderId): ProviderDescriptor {
  return PROVIDER_BY_ID.get(id)!;
}

export function providerSupports(id: ProviderId, capability: BrokerCapabilityType): boolean {
  return PROVIDER_BY_ID.get(id)?.capabilities.includes(capability) ?? false;
}
