/**
 * Circuit states and the transition table. The functional core is `CLOSED → OPEN → HALF_OPEN →
 * CLOSED`; the control states `FORCED_OPEN`, `FORCED_CLOSED` and `DISABLED` are operator overrides.
 * Pure vocabulary and structural rules — no timing, no counting, no IO.
 */

export type CircuitState =
  | 'CLOSED'
  | 'OPEN'
  | 'HALF_OPEN'
  | 'FORCED_OPEN'
  | 'FORCED_CLOSED'
  | 'DISABLED';

export type CircuitStateKind = 'functional' | 'forced' | 'disabled';

export interface CircuitStateDescriptor {
  readonly state: CircuitState;
  readonly label: string;
  readonly description: string;
  readonly kind: CircuitStateKind;
  /** Whether calls are permitted in this state (HALF_OPEN permits a limited number). */
  readonly permitsCalls: boolean;
}

export const CIRCUIT_STATES: readonly CircuitState[] = [
  'CLOSED',
  'OPEN',
  'HALF_OPEN',
  'FORCED_OPEN',
  'FORCED_CLOSED',
  'DISABLED',
];

const DESCRIPTORS: Record<CircuitState, CircuitStateDescriptor> = {
  CLOSED: {
    state: 'CLOSED',
    label: 'Closed',
    description: 'Calls flow normally; failures are tracked and may open the circuit.',
    kind: 'functional',
    permitsCalls: true,
  },
  OPEN: {
    state: 'OPEN',
    label: 'Open',
    description:
      'Calls are short-circuited; the provider is considered unhealthy until the recovery timeout elapses.',
    kind: 'functional',
    permitsCalls: false,
  },
  HALF_OPEN: {
    state: 'HALF_OPEN',
    label: 'Half-open',
    description: 'A limited number of trial calls probe whether the provider has recovered.',
    kind: 'functional',
    permitsCalls: true,
  },
  FORCED_OPEN: {
    state: 'FORCED_OPEN',
    label: 'Forced open',
    description: 'Operator override: every call is short-circuited regardless of health.',
    kind: 'forced',
    permitsCalls: false,
  },
  FORCED_CLOSED: {
    state: 'FORCED_CLOSED',
    label: 'Forced closed',
    description: 'Operator override: every call is permitted and the circuit never opens.',
    kind: 'forced',
    permitsCalls: true,
  },
  DISABLED: {
    state: 'DISABLED',
    label: 'Disabled',
    description: 'The circuit breaker is bypassed entirely; no tracking, no short-circuiting.',
    kind: 'disabled',
    permitsCalls: true,
  },
};

export function describeCircuitState(state: CircuitState): CircuitStateDescriptor {
  return DESCRIPTORS[state];
}

export function permitsCalls(state: CircuitState): boolean {
  return DESCRIPTORS[state].permitsCalls;
}

/** The allowed target states for each state. */
export const CIRCUIT_TRANSITIONS: Record<CircuitState, readonly CircuitState[]> = {
  CLOSED: ['OPEN', 'FORCED_OPEN', 'FORCED_CLOSED', 'DISABLED'],
  OPEN: ['HALF_OPEN', 'CLOSED', 'FORCED_OPEN', 'FORCED_CLOSED', 'DISABLED'],
  HALF_OPEN: ['CLOSED', 'OPEN', 'FORCED_OPEN', 'FORCED_CLOSED', 'DISABLED'],
  FORCED_OPEN: ['CLOSED', 'FORCED_CLOSED', 'DISABLED'],
  FORCED_CLOSED: ['CLOSED', 'FORCED_OPEN', 'DISABLED'],
  DISABLED: ['CLOSED', 'FORCED_OPEN', 'FORCED_CLOSED'],
};

export function canTransition(from: CircuitState, to: CircuitState): boolean {
  return from === to || CIRCUIT_TRANSITIONS[from].includes(to);
}
