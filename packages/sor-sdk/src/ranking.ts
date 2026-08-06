/**
 * The **venue ranking framework** — REAL, deterministic venue scoring and ranking. Each venue is
 * scored across normalized dimensions (cost, latency, liquidity, fill probability, preference) in
 * `[0, 1]` where higher is better; the routing policy selects how the composite score is formed. Pure
 * and deterministic — the same venues + policy always produce the same ranking. NO market data, NO
 * randomness. Consumed by both the SOR service and its UIs (single source of ranking truth).
 */
import type { RankedVenue, Venue, VenueScore } from './contracts';
import type { RoutingPolicyType } from './policies';

export interface RankingOptions {
  readonly weights?: Readonly<Record<string, number>>;
  readonly preferredVenueId?: string;
}

interface Bounds {
  readonly minFee: number;
  readonly maxFee: number;
  readonly minLatency: number;
  readonly maxLatency: number;
  readonly minPref: number;
  readonly maxPref: number;
}

function bounds(venues: readonly Venue[]): Bounds {
  const fees = venues.map((v) => v.metrics.feeBps);
  const lat = venues.map((v) => v.metrics.latencyMedianMs);
  const pref = venues.map((v) => v.metrics.preference);
  return {
    minFee: Math.min(...fees),
    maxFee: Math.max(...fees),
    minLatency: Math.min(...lat),
    maxLatency: Math.max(...lat),
    minPref: Math.min(...pref),
    maxPref: Math.max(...pref),
  };
}

/** Normalize `value` into `[0, 1]` (0 when the range is degenerate). */
function norm(value: number, min: number, max: number): number {
  return max > min ? (value - min) / (max - min) : 0.5;
}

/** The per-dimension score breakdown for a venue (higher is better). */
export function scoreDimensions(venue: Venue, b: Bounds, options: RankingOptions): VenueScore {
  const cost = 1 - norm(venue.metrics.feeBps, b.minFee, b.maxFee);
  const latency = 1 - norm(venue.metrics.latencyMedianMs, b.minLatency, b.maxLatency);
  const liquidity = venue.metrics.liquidityScore;
  const fill = venue.metrics.fillProbability;
  const preference =
    options.preferredVenueId === venue.id
      ? 1
      : 1 - norm(venue.metrics.preference, b.minPref, b.maxPref);
  return { cost, latency, liquidity, fill, preference, composite: 0 };
}

function composite(
  policyType: RoutingPolicyType,
  dims: VenueScore,
  options: RankingOptions,
  venueId: string,
): number {
  switch (policyType) {
    case 'LOWEST_COST':
      return dims.cost;
    case 'LOWEST_LATENCY':
      return dims.latency;
    case 'HIGHEST_LIQUIDITY':
      return dims.liquidity;
    case 'HIGHEST_FILL_PROBABILITY':
      return dims.fill;
    case 'PREFERRED_VENUE':
    case 'FAILOVER':
      return dims.preference;
    case 'MANUAL_OVERRIDE':
      return options.preferredVenueId === venueId ? 1 : 0;
    case 'WEIGHTED': {
      const w = options.weights ?? { cost: 1, latency: 1, liquidity: 1, fill: 1 };
      const sum = (w.cost ?? 0) + (w.latency ?? 0) + (w.liquidity ?? 0) + (w.fill ?? 0);
      if (sum <= 0) return (dims.cost + dims.latency + dims.liquidity + dims.fill) / 4;
      return (
        ((w.cost ?? 0) * dims.cost +
          (w.latency ?? 0) * dims.latency +
          (w.liquidity ?? 0) * dims.liquidity +
          (w.fill ?? 0) * dims.fill) /
        sum
      );
    }
    case 'BEST_AVAILABLE':
    case 'MULTI_VENUE':
    default:
      return (dims.cost + dims.latency + dims.liquidity + dims.fill) / 4;
  }
}

/**
 * Rank the feasible venues under a policy. Returns venues sorted by descending composite score, each
 * with its dimension breakdown; the top venue is `selected`, the runner-up is the `fallback`. Ties
 * break deterministically by venue id.
 */
export function rankVenues(
  venues: readonly Venue[],
  policyType: RoutingPolicyType,
  options: RankingOptions = {},
): RankedVenue[] {
  if (venues.length === 0) return [];
  const b = bounds(venues);
  const scored = venues.map((venue) => {
    const dims = scoreDimensions(venue, b, options);
    const score = composite(policyType, dims, options, venue.id);
    return { venue, breakdown: { ...dims, composite: score }, score };
  });
  scored.sort((a, b2) => b2.score - a.score || a.venue.id.localeCompare(b2.venue.id));
  return scored.map((entry, index) => ({
    rank: index + 1,
    venueId: entry.venue.id,
    venueName: entry.venue.name,
    venueType: entry.venue.type,
    score: entry.score,
    breakdown: entry.breakdown,
    feasible: true,
    selected: index === 0,
    fallback: index === 1,
  }));
}

/** The score of a single venue under a policy within a candidate set (for the venue explorer). */
export function scoreVenue(
  venue: Venue,
  venues: readonly Venue[],
  policyType: RoutingPolicyType,
  options: RankingOptions = {},
): VenueScore {
  const dims = scoreDimensions(venue, bounds(venues.length > 0 ? venues : [venue]), options);
  return { ...dims, composite: composite(policyType, dims, options, venue.id) };
}
