/**
 * Pure identifier and execution-arithmetic primitives — deterministic, no IO. The slice arithmetic
 * (executed quantity, remaining quantity, average execution price, progress) is standard execution
 * bookkeeping over the execution's own slice reports; NOT market data, statistics or PnL.
 */
import type { SliceResult } from './contracts';

/** The total executed quantity across slice reports. */
export function totalExecutedQuantity(slices: readonly SliceResult[]): number {
  let sum = 0;
  for (const slice of slices) sum += slice.quantity;
  return sum;
}

/** The remaining (un-executed) quantity given a total and its slice reports. */
export function remainingQuantity(quantity: number, slices: readonly SliceResult[]): number {
  return Math.max(0, quantity - totalExecutedQuantity(slices));
}

/** The quantity-weighted average execution price across slices, or `undefined` if none. */
export function averageExecutionPrice(slices: readonly SliceResult[]): number | undefined {
  let notional = 0;
  let quantity = 0;
  for (const slice of slices) {
    notional += slice.price * slice.quantity;
    quantity += slice.quantity;
  }
  return quantity > 0 ? notional / quantity : undefined;
}

/** The execution progress in `[0, 1]` (0 when quantity is 0). */
export function executionProgress(quantity: number, executed: number): number {
  return quantity > 0 ? Math.min(1, executed / quantity) : 0;
}

/** Split a quantity into `sliceCount` near-equal slices (last slice absorbs the remainder). */
export function sliceQuantities(quantity: number, sliceCount: number): number[] {
  const count = Math.max(1, Math.floor(sliceCount));
  const base = Math.floor((quantity / count) * 1e6) / 1e6;
  const slices: number[] = [];
  let allocated = 0;
  for (let i = 0; i < count - 1; i += 1) {
    slices.push(base);
    allocated += base;
  }
  slices.push(Math.max(0, quantity - allocated));
  return slices;
}
