/**
 * Execution policy vocabulary — the 10 canonical policy types, their parameter schemas and the venue
 * abstractions. The policy *framework* (the deterministic evaluators) lives in the Execution Engine
 * service's domain; this module is the shared vocabulary + descriptors + the evaluation result
 * shape. Pure metadata; NO broker/exchange/FIX, NO transport.
 */

/** The 10 canonical execution policy types. */
export type PolicyType =
  | 'IMMEDIATE'
  | 'SCHEDULED'
  | 'TIME_WINDOW'
  | 'PARTIAL'
  | 'RETRY'
  | 'TIMEOUT'
  | 'PRIORITY'
  | 'THROTTLING'
  | 'VENUE_SELECTION'
  | 'RISK_VALIDATION';

export type PolicyCategory = 'SCHEDULING' | 'SLICING' | 'RELIABILITY' | 'ROUTING' | 'GOVERNANCE';

export interface PolicyParam {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly unit: string;
}

export interface PolicyDescriptor {
  readonly type: PolicyType;
  readonly label: string;
  readonly description: string;
  readonly category: PolicyCategory;
  readonly params: readonly PolicyParam[];
}

const P = (
  name: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
  unit: string,
): PolicyParam => ({ name, label, defaultValue, min, max, unit });

export const POLICY_CATALOG: readonly PolicyDescriptor[] = [
  {
    type: 'IMMEDIATE',
    label: 'Immediate execution',
    description: 'Route to the venue as soon as validated.',
    category: 'SCHEDULING',
    params: [],
  },
  {
    type: 'SCHEDULED',
    label: 'Scheduled execution',
    description: 'Hold until a scheduled release time.',
    category: 'SCHEDULING',
    params: [P('delayMinutes', 'Delay', 15, 0, 1440, 'min')],
  },
  {
    type: 'TIME_WINDOW',
    label: 'Time-window execution',
    description: 'Only execute within an allowed intraday window.',
    category: 'SCHEDULING',
    params: [
      P('startMinute', 'Window start', 570, 0, 1439, 'min-of-day'),
      P('endMinute', 'Window end', 960, 0, 1439, 'min-of-day'),
    ],
  },
  {
    type: 'PARTIAL',
    label: 'Partial execution',
    description: 'Slice the order into child executions.',
    category: 'SLICING',
    params: [P('sliceCount', 'Slices', 4, 1, 100, 'slices')],
  },
  {
    type: 'RETRY',
    label: 'Execution retry',
    description: 'Retry a failed execution up to a limit.',
    category: 'RELIABILITY',
    params: [P('maxAttempts', 'Max attempts', 3, 0, 20, 'attempts')],
  },
  {
    type: 'TIMEOUT',
    label: 'Execution timeout',
    description: 'Fail an execution that exceeds a time budget.',
    category: 'RELIABILITY',
    params: [P('timeoutSeconds', 'Timeout', 300, 1, 86_400, 's')],
  },
  {
    type: 'PRIORITY',
    label: 'Execution priority',
    description: 'Order the execution queue by priority.',
    category: 'ROUTING',
    params: [P('priority', 'Priority', 5, 0, 10, 'level')],
  },
  {
    type: 'THROTTLING',
    label: 'Execution throttling',
    description: 'Cap the rate of child executions.',
    category: 'SLICING',
    params: [P('perMinute', 'Rate', 10, 1, 6000, '/min')],
  },
  {
    type: 'VENUE_SELECTION',
    label: 'Venue selection',
    description: 'Choose the execution venue by mode.',
    category: 'ROUTING',
    params: [],
  },
  {
    type: 'RISK_VALIDATION',
    label: 'Risk validation',
    description: 'Require pre-execution risk approval.',
    category: 'GOVERNANCE',
    params: [],
  },
];

export function describePolicy(type: PolicyType): PolicyDescriptor {
  return POLICY_CATALOG.find((policy) => policy.type === type)!;
}

export function policiesInCategory(category: PolicyCategory): readonly PolicyDescriptor[] {
  return POLICY_CATALOG.filter((policy) => policy.category === category);
}

/** The result of evaluating one policy (deterministic). */
export interface PolicyEvaluation {
  readonly type: PolicyType;
  /** Whether the policy permits the execution to proceed right now. */
  readonly allow: boolean;
  /** The policy's contribution to the plan (a short decision string). */
  readonly decision: string;
  readonly detail: string;
}

/* --------------------------------- venues ---------------------------------- */

/** Execution venue kinds — abstractions only (never a real broker/exchange endpoint). */
export type VenueKind = 'SIMULATOR' | 'PAPER' | 'LIVE';
export type ExecutionMode = 'SIMULATED' | 'PAPER' | 'LIVE';

export interface VenueDescriptor {
  readonly id: string;
  readonly label: string;
  readonly kind: VenueKind;
  readonly mode: ExecutionMode;
  readonly description: string;
}

/** The supported execution venue abstractions (routed to downstream, never contacted here). */
export const VENUES: readonly VenueDescriptor[] = [
  {
    id: 'execution-simulator',
    label: 'Execution Simulator',
    kind: 'SIMULATOR',
    mode: 'SIMULATED',
    description: 'Deterministic paper-trading simulation venue (Phase 6.11).',
  },
  {
    id: 'paper-venue',
    label: 'Paper venue',
    kind: 'PAPER',
    mode: 'PAPER',
    description: 'Paper/shadow venue abstraction.',
  },
  {
    id: 'live-trading-gateway',
    label: 'Live Trading gateway',
    kind: 'LIVE',
    mode: 'LIVE',
    description:
      'The governed live-trading gateway abstraction (Phase 6.12); requires authorization.',
  },
];

/** Select the default venue for an execution mode (venue-selection policy default). */
export function venueForMode(mode: ExecutionMode): VenueDescriptor {
  return VENUES.find((venue) => venue.mode === mode) ?? VENUES[1]!;
}

export function describeVenue(id: string): VenueDescriptor | undefined {
  return VENUES.find((venue) => venue.id === id);
}
