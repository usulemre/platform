/**
 * Execution query model + pure query application (scope / filter / sort) for the queue and history.
 * Deterministic; mirrors the Execution Engine service's search so both tiers behave identically.
 */
import {
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Execution,
  type ExecutionMode,
  type ExecutionStatus,
} from '@platform/execution-engine-sdk';

export type ExecutionScope =
  | 'ALL'
  | 'QUEUE'
  | 'ACTIVE'
  | 'WORKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type ExecutionSortField = 'createdAt' | 'updatedAt' | 'symbol' | 'status' | 'priority';
export type SortDir = 'asc' | 'desc';

export interface ExecutionQuery {
  readonly text?: string;
  readonly scope?: ExecutionScope;
  readonly status?: ExecutionStatus | 'ALL';
  readonly mode?: ExecutionMode | 'ALL';
  readonly sessionId?: string;
  readonly sortBy?: ExecutionSortField;
  readonly sortDir?: SortDir;
}

function inScope(execution: Execution, scope: ExecutionScope): boolean {
  switch (scope) {
    case 'ALL':
      return true;
    case 'QUEUE':
      return execution.status === 'WAITING_FOR_VENUE' || execution.status === 'EXECUTION_VALIDATED';
    case 'ACTIVE':
      return isActiveStatus(execution.status);
    case 'WORKING':
      return isWorkingStatus(execution.status);
    case 'COMPLETED':
      return execution.status === 'COMPLETED';
    case 'FAILED':
      return execution.status === 'FAILED';
    case 'CANCELLED':
      return execution.status === 'CANCELLED';
  }
  return isTerminalStatus(execution.status);
}

export function applyExecutionQuery(
  data: readonly Execution[],
  query: ExecutionQuery,
): Execution[] {
  const text = query.text?.trim().toLowerCase() ?? '';
  const scope = query.scope ?? 'ALL';
  const status = query.status ?? 'ALL';
  const mode = query.mode ?? 'ALL';
  const sessionId = query.sessionId?.trim() ?? '';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((execution) => {
    if (!inScope(execution, scope)) return false;
    if (status !== 'ALL' && execution.status !== status) return false;
    if (mode !== 'ALL' && execution.mode !== mode) return false;
    if (sessionId && execution.sessionId !== sessionId) return false;
    if (text) {
      const haystack =
        `${execution.clientOrderId} ${execution.symbol} ${execution.side} ${execution.mode} ${execution.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'priority') comparison = a.priority - b.priority;
    else if (sortBy === 'createdAt') comparison = a.createdAt.localeCompare(b.createdAt);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });
}
