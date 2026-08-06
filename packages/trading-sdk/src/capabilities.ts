/**
 * Canonical Live Trading Platform capabilities — the reusable governance/orchestration
 * services the platform exposes over the deployment lifecycle. Vocabulary + descriptors
 * only; behaviour is supplied by the service application layer and infrastructure
 * adapters. NO exchange/broker connectivity, NO order execution, NO REST/WebSocket/FIX.
 */
export type TradingCapability =
  | 'ACCOUNT_MANAGEMENT'
  | 'BROKER_ABSTRACTION'
  | 'STRATEGY_DEPLOYMENT'
  | 'ORDER_ORCHESTRATION'
  | 'POSITION_TRACKING'
  | 'BALANCE_TRACKING'
  | 'DEPLOYMENT_GOVERNANCE'
  | 'EMERGENCY_CONTROLS'
  | 'KILL_SWITCH'
  | 'PRODUCTION_HEALTH'
  | 'TRADING_METRICS'
  | 'TRADING_AUDIT';

export interface TradingCapabilityDescriptor {
  readonly capability: TradingCapability;
  readonly label: string;
  readonly description: string;
}

export const TRADING_CAPABILITIES: readonly TradingCapability[] = [
  'ACCOUNT_MANAGEMENT',
  'BROKER_ABSTRACTION',
  'STRATEGY_DEPLOYMENT',
  'ORDER_ORCHESTRATION',
  'POSITION_TRACKING',
  'BALANCE_TRACKING',
  'DEPLOYMENT_GOVERNANCE',
  'EMERGENCY_CONTROLS',
  'KILL_SWITCH',
  'PRODUCTION_HEALTH',
  'TRADING_METRICS',
  'TRADING_AUDIT',
];

const DESCRIPTORS: Record<TradingCapability, TradingCapabilityDescriptor> = {
  ACCOUNT_MANAGEMENT: {
    capability: 'ACCOUNT_MANAGEMENT',
    label: 'Account management',
    description: 'Manage trading accounts (by reference; no credentials).',
  },
  BROKER_ABSTRACTION: {
    capability: 'BROKER_ABSTRACTION',
    label: 'Broker abstraction',
    description: 'Broker/exchange connector abstractions (no SDKs).',
  },
  STRATEGY_DEPLOYMENT: {
    capability: 'STRATEGY_DEPLOYMENT',
    label: 'Strategy deployment',
    description: 'Promote validated strategies from paper to production (governed).',
  },
  ORDER_ORCHESTRATION: {
    capability: 'ORDER_ORCHESTRATION',
    label: 'Order orchestration',
    description: 'Coordinate production order lifecycles (executed elsewhere).',
  },
  POSITION_TRACKING: {
    capability: 'POSITION_TRACKING',
    label: 'Position tracking',
    description: 'Reflect open/closed positions (values supplied, never computed).',
  },
  BALANCE_TRACKING: {
    capability: 'BALANCE_TRACKING',
    label: 'Balance tracking',
    description: 'Reflect account balances (values supplied).',
  },
  DEPLOYMENT_GOVERNANCE: {
    capability: 'DEPLOYMENT_GOVERNANCE',
    label: 'Deployment governance',
    description: 'Risk + deployment approval gates and authorization tokens.',
  },
  EMERGENCY_CONTROLS: {
    capability: 'EMERGENCY_CONTROLS',
    label: 'Emergency controls',
    description: 'Pause / stop / emergency-stop / rollback controls.',
  },
  KILL_SWITCH: {
    capability: 'KILL_SWITCH',
    label: 'Kill switch',
    description: 'Always-available human kill switch forcing halt (never gated by AI).',
  },
  PRODUCTION_HEALTH: {
    capability: 'PRODUCTION_HEALTH',
    label: 'Production health',
    description: 'Reflect deployment health signals (reported, not computed).',
  },
  TRADING_METRICS: {
    capability: 'TRADING_METRICS',
    label: 'Trading metrics',
    description: 'Reflect production trading indicators (values supplied).',
  },
  TRADING_AUDIT: {
    capability: 'TRADING_AUDIT',
    label: 'Trading audit',
    description: 'The tamper-evident audit timeline of trading governance events.',
  },
};

export function describeCapability(capability: TradingCapability): TradingCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly TradingCapabilityDescriptor[] {
  return TRADING_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
