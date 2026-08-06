/**
 * Provider registry views — deterministic reporting over the canonical provider catalog and the
 * registered brokers: the capability matrix (provider × capability) and per-provider registration
 * counts. Pure: no IO. The provider *adapters* are injected elsewhere (composition); this module only
 * describes the catalog and coverage. Powers the Capability Explorer and Broker Registry views.
 */
import {
  CAPABILITY_CATALOG,
  PROVIDER_CATALOG,
  type Broker,
  type BrokerCapabilityType,
  type ProviderDescriptor,
  type ProviderId,
} from '@platform/broker-sdk';

export interface ProviderRegistration {
  readonly descriptor: ProviderDescriptor;
  readonly registeredBrokers: number;
  readonly capabilityCount: number;
}

export function providerRegistrations(brokers: readonly Broker[]): readonly ProviderRegistration[] {
  const counts = new Map<ProviderId, number>();
  for (const broker of brokers)
    counts.set(broker.providerId, (counts.get(broker.providerId) ?? 0) + 1);
  return PROVIDER_CATALOG.map((descriptor) => ({
    descriptor,
    registeredBrokers: counts.get(descriptor.id) ?? 0,
    capabilityCount: descriptor.capabilities.length,
  }));
}

export interface CapabilityMatrixRow {
  readonly capability: BrokerCapabilityType;
  readonly label: string;
  readonly domain: string;
  readonly providers: readonly { readonly providerId: ProviderId; readonly supported: boolean }[];
  readonly supportedCount: number;
}

export function capabilityMatrix(): readonly CapabilityMatrixRow[] {
  return CAPABILITY_CATALOG.map((cap) => {
    const providers = PROVIDER_CATALOG.map((p) => ({
      providerId: p.id,
      supported: p.capabilities.includes(cap.type),
    }));
    return {
      capability: cap.type,
      label: cap.label,
      domain: cap.domain,
      providers,
      supportedCount: providers.filter((p) => p.supported).length,
    };
  });
}
