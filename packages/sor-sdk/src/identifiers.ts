/**
 * Pure identifier and routing-arithmetic primitives — deterministic, no IO. Venue feasibility is a
 * structural check over capability and status; NOT market data or connectivity.
 */
import type { RoutingRequest, Venue } from './contracts';

/** Whether a venue can feasibly handle a routing request (capability, status, blacklist). */
export function isVenueFeasible(
  venue: Venue,
  request: RoutingRequest,
  blacklisted: readonly string[],
): boolean {
  if (blacklisted.includes(venue.id)) return false;
  if (venue.status === 'OFFLINE' || venue.status === 'BLACKLISTED') return false;
  if (!venue.capability.assetClasses.includes(request.assetClass)) return false;
  if (
    request.quantity < venue.capability.minQuantity ||
    request.quantity > venue.capability.maxQuantity
  )
    return false;
  return true;
}

/** The reason a venue is infeasible (for the filtering trace), or null if feasible. */
export function infeasibleReason(
  venue: Venue,
  request: RoutingRequest,
  blacklisted: readonly string[],
): string | null {
  if (blacklisted.includes(venue.id)) return 'blacklisted';
  if (venue.status === 'OFFLINE') return 'offline';
  if (venue.status === 'BLACKLISTED') return 'blacklisted';
  if (!venue.capability.assetClasses.includes(request.assetClass))
    return `no ${request.assetClass} capability`;
  if (request.quantity < venue.capability.minQuantity) return 'below min quantity';
  if (request.quantity > venue.capability.maxQuantity) return 'above max quantity';
  return null;
}
