/**
 * The canonical **broker capability contracts** — the ten capabilities a provider adapter MAY declare
 * and implement behind the gateway's provider interface. These are abstract capability *descriptors*
 * (vocabulary + metadata), NOT implementations: no exchange REST call, no WebSocket protocol and no
 * FIX message is defined here or anywhere in this SDK. A provider declares the subset it supports; the
 * gateway routes a capability request only to a broker that declares the capability.
 */

/** The ten canonical broker capabilities. */
export type BrokerCapabilityType =
  | 'SUBMIT_ORDER'
  | 'CANCEL_ORDER'
  | 'REPLACE_ORDER'
  | 'QUERY_ORDER'
  | 'QUERY_POSITIONS'
  | 'QUERY_BALANCES'
  | 'MARKET_DATA_SUBSCRIPTION'
  | 'HISTORICAL_DATA'
  | 'ACCOUNT_INFORMATION'
  | 'HEARTBEAT';

export type CapabilityDomain = 'TRADING' | 'MARKET_DATA' | 'ACCOUNT' | 'CONNECTIVITY';

export interface BrokerCapabilityDescriptor {
  readonly type: BrokerCapabilityType;
  readonly label: string;
  readonly domain: CapabilityDomain;
  readonly description: string;
  /** Whether the capability mutates broker/venue state (order write path) vs a read. */
  readonly mutating: boolean;
}

export const CAPABILITY_CATALOG: readonly BrokerCapabilityDescriptor[] = [
  {
    type: 'SUBMIT_ORDER',
    label: 'Submit order',
    domain: 'TRADING',
    description: 'Submit a new order to the venue through the provider adapter.',
    mutating: true,
  },
  {
    type: 'CANCEL_ORDER',
    label: 'Cancel order',
    domain: 'TRADING',
    description: 'Cancel a working order.',
    mutating: true,
  },
  {
    type: 'REPLACE_ORDER',
    label: 'Replace order',
    domain: 'TRADING',
    description: 'Amend/replace a working order (price or quantity).',
    mutating: true,
  },
  {
    type: 'QUERY_ORDER',
    label: 'Query order',
    domain: 'TRADING',
    description: 'Query the status of an order or order history.',
    mutating: false,
  },
  {
    type: 'QUERY_POSITIONS',
    label: 'Query positions',
    domain: 'ACCOUNT',
    description: 'Read current positions for synchronization.',
    mutating: false,
  },
  {
    type: 'QUERY_BALANCES',
    label: 'Query balances',
    domain: 'ACCOUNT',
    description: 'Read cash/asset balances for synchronization.',
    mutating: false,
  },
  {
    type: 'MARKET_DATA_SUBSCRIPTION',
    label: 'Market data subscription',
    domain: 'MARKET_DATA',
    description: 'Subscribe to streaming market data (routed to the Market Data Platform).',
    mutating: false,
  },
  {
    type: 'HISTORICAL_DATA',
    label: 'Historical data',
    domain: 'MARKET_DATA',
    description: 'Request historical bars/trades.',
    mutating: false,
  },
  {
    type: 'ACCOUNT_INFORMATION',
    label: 'Account information',
    domain: 'ACCOUNT',
    description: 'Read account metadata (permissions, limits, sub-accounts).',
    mutating: false,
  },
  {
    type: 'HEARTBEAT',
    label: 'Heartbeat',
    domain: 'CONNECTIVITY',
    description: 'Liveness heartbeat used by health monitoring.',
    mutating: false,
  },
];

export const CAPABILITY_TYPES: readonly BrokerCapabilityType[] = CAPABILITY_CATALOG.map(
  (c) => c.type,
);

const CAPABILITY_BY_TYPE = new Map(CAPABILITY_CATALOG.map((c) => [c.type, c] as const));

export function describeCapability(type: BrokerCapabilityType): BrokerCapabilityDescriptor {
  return CAPABILITY_BY_TYPE.get(type)!;
}

/** Whether a set of declared capabilities includes a required one. */
export function hasCapability(
  declared: readonly BrokerCapabilityType[],
  required: BrokerCapabilityType,
): boolean {
  return declared.includes(required);
}

/** Which required capabilities are missing from a declared set. */
export function missingCapabilities(
  declared: readonly BrokerCapabilityType[],
  required: readonly BrokerCapabilityType[],
): readonly BrokerCapabilityType[] {
  return required.filter((c) => !declared.includes(c));
}
