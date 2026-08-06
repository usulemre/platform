/**
 * Canonical broker/exchange CONNECTOR ABSTRACTIONS for the Live Trading Platform. These
 * are vocabulary + descriptors ONLY — they describe the *kinds* of brokers and the
 * initial provider placeholders the platform can be configured against. They contain NO
 * exchange SDK, NO broker SDK, NO API keys, NO HTTP/REST client, NO WebSocket, NO FIX.
 * Actual exchange implementations belong to future infrastructure packages behind these
 * abstractions.
 */
export type BrokerKind =
  | 'CRYPTO_EXCHANGE'
  | 'TRADITIONAL_BROKER'
  | 'OPTIONS_BROKER'
  | 'FUTURES_BROKER'
  | 'FOREX_BROKER';

export interface BrokerKindDescriptor {
  readonly kind: BrokerKind;
  readonly label: string;
  readonly description: string;
}

export const BROKER_KINDS: readonly BrokerKind[] = [
  'CRYPTO_EXCHANGE',
  'TRADITIONAL_BROKER',
  'OPTIONS_BROKER',
  'FUTURES_BROKER',
  'FOREX_BROKER',
];

const KIND_DESCRIPTORS: Record<BrokerKind, BrokerKindDescriptor> = {
  CRYPTO_EXCHANGE: {
    kind: 'CRYPTO_EXCHANGE',
    label: 'Crypto exchange',
    description: 'Digital-asset exchange abstraction.',
  },
  TRADITIONAL_BROKER: {
    kind: 'TRADITIONAL_BROKER',
    label: 'Traditional broker',
    description: 'Equities / multi-asset broker abstraction.',
  },
  OPTIONS_BROKER: {
    kind: 'OPTIONS_BROKER',
    label: 'Options broker',
    description: 'Listed-options broker abstraction.',
  },
  FUTURES_BROKER: {
    kind: 'FUTURES_BROKER',
    label: 'Futures broker',
    description: 'Futures / derivatives broker abstraction.',
  },
  FOREX_BROKER: {
    kind: 'FOREX_BROKER',
    label: 'Forex broker',
    description: 'FX broker abstraction.',
  },
};

export function describeBrokerKind(kind: BrokerKind): BrokerKindDescriptor {
  return KIND_DESCRIPTORS[kind];
}

/** The canonical initial provider placeholders (abstractions only — never wired). */
export type ProviderId =
  | 'binance'
  | 'hyperliquid'
  | 'deribit'
  | 'interactive-brokers'
  | 'alpaca'
  | 'bist';

export interface ProviderDescriptor {
  readonly id: ProviderId;
  readonly name: string;
  readonly kind: BrokerKind;
  readonly description: string;
}

export const PROVIDERS: readonly ProviderDescriptor[] = [
  {
    id: 'binance',
    name: 'Binance',
    kind: 'CRYPTO_EXCHANGE',
    description: 'Crypto exchange connector placeholder.',
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    kind: 'CRYPTO_EXCHANGE',
    description: 'On-chain perpetuals connector placeholder.',
  },
  {
    id: 'deribit',
    name: 'Deribit',
    kind: 'OPTIONS_BROKER',
    description: 'Crypto options/futures connector placeholder.',
  },
  {
    id: 'interactive-brokers',
    name: 'Interactive Brokers',
    kind: 'TRADITIONAL_BROKER',
    description: 'Multi-asset broker connector placeholder.',
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    kind: 'TRADITIONAL_BROKER',
    description: 'US equities broker connector placeholder.',
  },
  {
    id: 'bist',
    name: 'BIST',
    kind: 'TRADITIONAL_BROKER',
    description: 'Borsa İstanbul connector placeholder.',
  },
];

export function describeProvider(id: ProviderId): ProviderDescriptor | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}
