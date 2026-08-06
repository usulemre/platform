/**
 * @platform/provider-bist — the Borsa İstanbul (BIST) broker/venue provider adapter (PLACEHOLDER).
 *
 * Supplies the gateway registry with a Borsa İstanbul (BIST) adapter built on the shared placeholder factory from
 * `@platform/broker-sdk`. It declares the provider's capability contracts truthfully but implements NO
 * transport: NO exchange-specific REST call, NO WebSocket protocol and NO FIX message. Swapping in a
 * concrete adapter later requires no change to the broker-gateway service (dependency injection via
 * the provider registry). Registered by id, resolved through the `BrokerProviderPort` contract.
 */
import {
  createPlaceholderProvider,
  describeProvider,
  type BrokerProviderFactory,
  type BrokerProviderPort,
  type ProviderDescriptor,
  type ProviderId,
} from '@platform/broker-sdk';

/** The provider id(s) supplied by this package. */
export const PROVIDER_IDS: readonly ProviderId[] = ['bist'];

/** The descriptor(s) supplied by this package. */
export const PROVIDER_DESCRIPTORS: readonly ProviderDescriptor[] =
  PROVIDER_IDS.map(describeProvider);

/** Construct the placeholder adapter for a provider id served by this package. */
export function createBistProvider(id: ProviderId = 'bist'): BrokerProviderPort {
  if (!PROVIDER_IDS.includes(id))
    throw new Error(`@platform/provider-bist does not serve provider "${id}"`);
  return createPlaceholderProvider(describeProvider(id));
}

/** The registry entries this package contributes (id → factory), for gateway composition. */
export const providerFactories: Readonly<Record<string, BrokerProviderFactory>> = {
  bist: () => createPlaceholderProvider(describeProvider('bist')),
};
