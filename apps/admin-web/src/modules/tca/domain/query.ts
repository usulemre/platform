/**
 * Execution query — the UI-side filter/sort applied to post-trade execution records before analysis.
 * Pure and deterministic. Mirrors the tca-service search contract.
 */
import type { ExecutionInput, ExecutionMode, Side } from '@platform/tca-sdk';

export interface ExecutionQuery {
  readonly symbol?: string;
  readonly venue?: string;
  readonly side?: Side;
  readonly mode?: ExecutionMode;
  readonly search?: string;
  readonly sortBy?: 'executedAt' | 'symbol' | 'venue';
  readonly sortDir?: 'asc' | 'desc';
}

export function applyExecutionQuery(
  executions: readonly ExecutionInput[],
  query: ExecutionQuery = {},
): readonly ExecutionInput[] {
  const term = query.search?.trim().toLowerCase();
  const filtered = executions.filter((e) => {
    if (query.symbol && e.symbol !== query.symbol) return false;
    if (query.venue && e.venue !== query.venue) return false;
    if (query.side && e.side !== query.side) return false;
    if (query.mode && e.mode !== query.mode) return false;
    if (term && !`${e.id} ${e.orderId} ${e.symbol} ${e.venue}`.toLowerCase().includes(term))
      return false;
    return true;
  });
  const sortBy = query.sortBy ?? 'executedAt';
  const dir = query.sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const av = sortBy === 'symbol' ? a.symbol : sortBy === 'venue' ? a.venue : a.executedAt;
    const bv = sortBy === 'symbol' ? b.symbol : sortBy === 'venue' ? b.venue : b.executedAt;
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}
