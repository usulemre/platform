/**
 * Execution sessions — a governed batch/run of executions. Pure, immutable helpers for the session
 * lifecycle (open → active → closed) and membership. No IO.
 */
import type {
  Execution,
  ExecutionMode,
  ExecutionSession,
  SessionStatus,
} from '@platform/execution-engine-sdk';

export function openSession(
  id: string,
  label: string,
  mode: ExecutionMode,
  openedBy: string,
  at: string,
  note = '',
): ExecutionSession {
  return { id, label, mode, status: 'OPEN', executionIds: [], openedBy, openedAt: at, note };
}

export function addExecutionToSession(
  session: ExecutionSession,
  executionId: string,
): ExecutionSession {
  if (session.executionIds.includes(executionId)) return session;
  return {
    ...session,
    status: session.status === 'OPEN' ? 'ACTIVE' : session.status,
    executionIds: [...session.executionIds, executionId],
  };
}

export function closeSession(session: ExecutionSession, at: string): ExecutionSession {
  return { ...session, status: 'CLOSED', closedAt: at };
}

export interface SessionSummary {
  readonly sessionId: string;
  readonly label: string;
  readonly status: SessionStatus;
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly active: number;
}

/** Summarize a session over the executions it contains. */
export function summarizeSession(
  session: ExecutionSession,
  executions: readonly Execution[],
): SessionSummary {
  const members = executions.filter((execution) => session.executionIds.includes(execution.id));
  return {
    sessionId: session.id,
    label: session.label,
    status: session.status,
    total: members.length,
    completed: members.filter((e) => e.status === 'COMPLETED').length,
    failed: members.filter((e) => e.status === 'FAILED').length,
    active: members.filter(
      (e) => e.status !== 'COMPLETED' && e.status !== 'FAILED' && e.status !== 'CANCELLED',
    ).length,
  };
}
