/**
 * The **Execution Executors** — the uniform steps that advance an execution through its lifecycle and
 * execute its plan's slices. Executors compose the immutable lifecycle transitions; the actual venue
 * interaction is an abstraction (the price of a slice is supplied by the caller / venue port, never
 * fetched here). Pure and deterministic. No broker/exchange/FIX/WebSocket.
 */
import type { Execution, SliceResult } from '@platform/execution-engine-sdk';
import { recordSlice, startStep, type LifecycleResult } from './lifecycle';

/** The quantity of the next slice to execute (from the plan's tasks, else the remainder). */
export function nextSliceQuantity(execution: Execution): number {
  const index = execution.result.slices.length;
  const task = execution.tasks[index];
  return task ? task.quantity : execution.result.remainingQuantity;
}

/**
 * Execute the next slice at the supplied price (from the venue abstraction). Starts the execution if
 * it is still waiting for the venue. Returns the immutable next execution or a failure reason.
 */
export function executeSlice(
  execution: Execution,
  price: number,
  at: string,
  actor = 'exec-venue',
): LifecycleResult {
  let current = execution;
  if (current.status === 'WAITING_FOR_VENUE') {
    const started = startStep(current, actor, at);
    if (!started.ok) return started;
    current = started.execution;
  }
  const quantity = nextSliceQuantity(current);
  if (quantity <= 0) return { ok: false, execution: current, reason: 'nothing left to execute' };
  const index = current.result.slices.length;
  const slice: SliceResult = {
    taskId: current.tasks[index]?.id ?? `${current.id}:T${index + 1}`,
    quantity,
    price,
    venue: current.result.venue || current.plan?.venue || 'paper-venue',
    at,
  };
  return recordSlice(current, slice, actor, at);
}

/**
 * Execute every remaining slice at the supplied price, returning the final (COMPLETED) execution.
 * Deterministic — the price and timestamps are supplied by the caller. Used for a full execution run.
 */
export function executeAll(
  execution: Execution,
  price: number,
  at: string,
  actor = 'exec-venue',
): LifecycleResult {
  let current = execution;
  let guard = 0;
  while (current.status !== 'COMPLETED' && guard < 10_000) {
    guard += 1;
    const result = executeSlice(current, price, at, actor);
    if (!result.ok) return result;
    current = result.execution;
  }
  return { ok: true, execution: current };
}
