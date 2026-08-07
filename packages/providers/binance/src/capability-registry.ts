/**
 * `BinanceCapabilityRegistry` — the truthful declaration of which Broker Gateway capability contracts
 * this adapter implements for a given market. It is backed by the canonical provider descriptor in the
 * Broker Gateway SDK (so the gateway and the adapter never disagree) and refines it per market: Spot
 * exposes no derivatives positions, Futures does. The registry only *declares*; the gateway routes a
 * capability request to a broker solely when the capability is declared here.
 */
import {
  describeCapability,
  describeProvider,
  type BrokerCapabilityDescriptor,
  type BrokerCapabilityType,
  type ProviderId,
} from '@platform/broker-sdk';
import { MARKET_BY_PROVIDER, type BinanceMarket } from './constants';

export class BinanceCapabilityRegistry {
  readonly providerId: ProviderId;
  readonly market: BinanceMarket;
  private readonly declared: ReadonlySet<BrokerCapabilityType>;

  constructor(providerId: ProviderId) {
    this.providerId = providerId;
    this.market = MARKET_BY_PROVIDER[providerId as keyof typeof MARKET_BY_PROVIDER] ?? 'SPOT';
    const descriptor = describeProvider(providerId);
    const declared = new Set<BrokerCapabilityType>(descriptor.capabilities);
    // Spot markets have no derivatives position book; drop the positions capability there.
    if (this.market === 'SPOT') declared.delete('QUERY_POSITIONS');
    this.declared = declared;
  }

  /** The declared capabilities, in canonical catalog order. */
  list(): readonly BrokerCapabilityType[] {
    return [...this.declared];
  }

  /** Whether a capability is declared (and therefore implemented) for this market. */
  supports(capability: BrokerCapabilityType): boolean {
    return this.declared.has(capability);
  }

  /** The full descriptor for each declared capability (for UI/introspection). */
  describe(): readonly BrokerCapabilityDescriptor[] {
    return this.list().map(describeCapability);
  }
}
