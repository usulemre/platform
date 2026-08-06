/**
 * Pure identifier and capability-feasibility primitives — deterministic, no IO. Capability feasibility
 * is a structural check over a broker's declared capabilities and lifecycle status; NOT connectivity.
 */
import type { BrokerCapabilityType } from './capabilities';
import { isOperationalStatus } from './lifecycle';
import type { Broker } from './types';

/** Whether a broker can currently serve a capability request (declared, enabled and operational). */
export function canServeCapability(broker: Broker, capability: BrokerCapabilityType): boolean {
  if (!isOperationalStatus(broker.status)) return false;
  const declared = broker.capabilities.find((c) => c.type === capability);
  return Boolean(declared?.enabled);
}

/** The reason a broker cannot serve a capability (for a trace), or null if it can. */
export function capabilityBlockReason(
  broker: Broker,
  capability: BrokerCapabilityType,
): string | null {
  if (!isOperationalStatus(broker.status)) return `broker ${broker.status.toLowerCase()}`;
  const declared = broker.capabilities.find((c) => c.type === capability);
  if (!declared) return 'capability not declared';
  if (!declared.enabled) return 'capability disabled';
  return null;
}

/** The set of enabled capability types declared by a broker. */
export function enabledCapabilities(broker: Broker): readonly BrokerCapabilityType[] {
  return broker.capabilities.filter((c) => c.enabled).map((c) => c.type);
}
