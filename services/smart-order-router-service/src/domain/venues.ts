/**
 * Venue derivations — deterministic venue health and latency computed from the canonical venue
 * reference data (status + metrics). No connectivity, no probing; inert reference data only. Powers
 * the Venue Explorer and Venue Health views.
 */
import type { Venue, VenueHealth, VenueLatency, VenueStatus } from '@platform/sor-sdk';

const UPTIME: Record<VenueStatus, number> = {
  ONLINE: 0.999,
  DEGRADED: 0.95,
  OFFLINE: 0,
  BLACKLISTED: 0,
};
const ERROR_RATE: Record<VenueStatus, number> = {
  ONLINE: 0.001,
  DEGRADED: 0.05,
  OFFLINE: 1,
  BLACKLISTED: 1,
};

export function venueHealth(venue: Venue, checkedAt: string): VenueHealth {
  return {
    venueId: venue.id,
    status: venue.status,
    uptime: UPTIME[venue.status],
    errorRate: ERROR_RATE[venue.status],
    checkedAt,
    note:
      venue.status === 'ONLINE'
        ? 'Healthy.'
        : venue.status === 'DEGRADED'
          ? 'Degraded — elevated error rate.'
          : venue.status === 'OFFLINE'
            ? 'Offline — not routable.'
            : 'Blacklisted — excluded from routing.',
  };
}

export function venueLatency(venue: Venue): VenueLatency {
  return {
    venueId: venue.id,
    medianMs: venue.metrics.latencyMedianMs,
    p99Ms: venue.metrics.latencyP99Ms,
  };
}

/** Apply blacklist status to venues (marks blacklisted venues BLACKLISTED). */
export function withBlacklist(venues: readonly Venue[], blacklisted: readonly string[]): Venue[] {
  return venues.map((venue) =>
    blacklisted.includes(venue.id) ? { ...venue, status: 'BLACKLISTED' as VenueStatus } : venue,
  );
}
