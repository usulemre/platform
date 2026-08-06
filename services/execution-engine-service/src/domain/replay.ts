/**
 * Execution replay — deterministic event-sourced reconstruction of an execution's status timeline
 * from its recorded lifecycle events, validated against the state machine. Powers the Execution
 * Replay view and proves the event log is consistent with the current status. No IO.
 */
import {
  canTransition,
  type Execution,
  type ExecutionState,
  type ExecutionStatus,
} from '@platform/execution-engine-sdk';

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: ExecutionStatus;
  readonly to: ExecutionStatus;
  readonly legalTransition: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly executionId: string;
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: ExecutionStatus;
  readonly recordedStatus: ExecutionStatus;
  readonly consistent: boolean;
  readonly states: readonly ExecutionState[];
}

export function replayExecution(execution: Execution): ReplayResult {
  let current: ExecutionStatus = 'ORDER_RECEIVED';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: ExecutionState[] = [];
  let index = 0;

  for (const event of execution.events) {
    if (event.status === undefined) continue;
    const to = event.status;
    if (index === 0) {
      current = to;
      steps.push({
        index,
        type: event.type,
        from: to,
        to,
        legalTransition: true,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
    } else {
      const legal = canTransition(current, to) || current === to;
      if (!legal) legalThroughout = false;
      steps.push({
        index,
        type: event.type,
        from: current,
        to,
        legalTransition: legal,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
      current = to;
    }
    states.push({ status: to, at: event.at, note: event.message });
    index += 1;
  }

  return {
    executionId: execution.id,
    steps,
    reconstructedStatus: current,
    recordedStatus: execution.status,
    consistent: legalThroughout && current === execution.status,
    states,
  };
}
