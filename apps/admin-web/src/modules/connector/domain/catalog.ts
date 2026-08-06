/**
 * Connector Type catalog + Connector Factory abstraction.
 *
 * This is the canonical, extensible description of every supported connector
 * TYPE and a pure factory that yields a connector *descriptor* (an abstraction /
 * blueprint) for a type. It creates abstractions only — never a live connector,
 * never a network client. Concrete provider implementations live in future
 * infrastructure packages and bind to these descriptors.
 */
import type { ConnectorTypeDto } from './dto';

export interface ConnectorTypeDescriptor {
  readonly type: ConnectorTypeDto;
  readonly label: string;
  readonly description: string;
  /** Capability keys a connector of this type is expected to declare. */
  readonly capabilityKeys: readonly string[];
  /** Whether connectors of this type typically require brokered credentials. */
  readonly requiresCredentials: boolean;
}

const DESCRIPTORS: Record<ConnectorTypeDto, ConnectorTypeDescriptor> = {
  MARKET_DATA: {
    type: 'MARKET_DATA',
    label: 'Market data provider',
    description: 'Historical and reference market data (prices, fundamentals, corporate actions).',
    capabilityKeys: ['historical', 'reference', 'snapshot'],
    requiresCredentials: true,
  },
  EXCHANGE: {
    type: 'EXCHANGE',
    label: 'Exchange API',
    description: 'Trading venue market data and (governed) order interfaces.',
    capabilityKeys: ['market-data', 'streaming', 'order-entry'],
    requiresCredentials: true,
  },
  BROKER: {
    type: 'BROKER',
    label: 'Broker API',
    description: 'Brokerage account, positions and (governed) order routing abstractions.',
    capabilityKeys: ['accounts', 'positions', 'order-entry'],
    requiresCredentials: true,
  },
  OPTIONS: {
    type: 'OPTIONS',
    label: 'Options provider',
    description: 'Options chains, greeks and derivatives market data.',
    capabilityKeys: ['chains', 'greeks', 'streaming'],
    requiresCredentials: true,
  },
  BLOCKCHAIN: {
    type: 'BLOCKCHAIN',
    label: 'Blockchain provider',
    description: 'On-chain data, node access and blockchain event abstractions.',
    capabilityKeys: ['chain-data', 'events', 'rpc'],
    requiresCredentials: true,
  },
  NEWS: {
    type: 'NEWS',
    label: 'News provider',
    description: 'News, filings and event feeds for research ingestion.',
    capabilityKeys: ['articles', 'sentiment', 'streaming'],
    requiresCredentials: true,
  },
  MACRO_DATA: {
    type: 'MACRO_DATA',
    label: 'Macro data provider',
    description: 'Economic and macroeconomic time series.',
    capabilityKeys: ['series', 'releases', 'revisions'],
    requiresCredentials: false,
  },
  ALT_DATA: {
    type: 'ALT_DATA',
    label: 'Alternative data provider',
    description: 'Alternative datasets (filings, web, geospatial, etc.).',
    capabilityKeys: ['datasets', 'search', 'bulk'],
    requiresCredentials: false,
  },
  AI_PROVIDER: {
    type: 'AI_PROVIDER',
    label: 'AI provider',
    description: 'Model-serving providers bound via the Model Registry (metadata only).',
    capabilityKeys: ['completion', 'embedding', 'tool-use'],
    requiresCredentials: true,
  },
  STORAGE: {
    type: 'STORAGE',
    label: 'Storage provider',
    description: 'Object and artifact storage backends.',
    capabilityKeys: ['object-store', 'lifecycle', 'versioning'],
    requiresCredentials: true,
  },
  NOTIFICATION: {
    type: 'NOTIFICATION',
    label: 'Notification provider',
    description: 'Outbound delivery channels for the Notification Center.',
    capabilityKeys: ['send', 'templates', 'delivery-status'],
    requiresCredentials: true,
  },
};

export const CONNECTOR_TYPE_ORDER: readonly ConnectorTypeDto[] = [
  'MARKET_DATA',
  'EXCHANGE',
  'BROKER',
  'OPTIONS',
  'BLOCKCHAIN',
  'NEWS',
  'MACRO_DATA',
  'ALT_DATA',
  'AI_PROVIDER',
  'STORAGE',
  'NOTIFICATION',
];

/**
 * Connector Factory (abstraction only). Given a connector type it returns the
 * canonical descriptor/blueprint. It NEVER instantiates a live connector or a
 * transport — those are supplied by infrastructure adapters keyed on `type`.
 */
export const connectorFactory = {
  describe(type: ConnectorTypeDto): ConnectorTypeDescriptor {
    return DESCRIPTORS[type];
  },
  listTypes(): readonly ConnectorTypeDescriptor[] {
    return CONNECTOR_TYPE_ORDER.map((type) => DESCRIPTORS[type]);
  },
} as const;

export function typeLabel(type: ConnectorTypeDto): string {
  return DESCRIPTORS[type].label;
}
