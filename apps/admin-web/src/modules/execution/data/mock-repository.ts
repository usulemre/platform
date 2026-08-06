/**
 * In-memory mock adapter for the Execution UI. Synthetic execution DATA only — NO broker/exchange
 * SDK, NO API keys, NO HTTP/WebSocket/FIX, NO order execution, no persistence. The executions are
 * built by walking legal lifecycle paths so their event logs replay consistently. This is the UI's
 * own mock, independent of the service tier.
 */
import type { Execution, ExecutionSession } from '@platform/execution-engine-sdk';
import { applyExecutionQuery, type ExecutionQuery } from '../domain/query';
import type { ExecutionRepository } from './repository';
import { EXECUTIONS, SESSIONS } from './seed';

export class MockExecutionRepository implements ExecutionRepository {
  async listExecutions(query: ExecutionQuery): Promise<readonly Execution[]> {
    return applyExecutionQuery(EXECUTIONS, query);
  }
  async listAll(): Promise<readonly Execution[]> {
    return EXECUTIONS;
  }
  async getExecution(id: string): Promise<Execution | null> {
    return EXECUTIONS.find((execution) => execution.id === id) ?? null;
  }
  async listSessions(): Promise<readonly ExecutionSession[]> {
    return SESSIONS;
  }
}

export { EXECUTIONS, SESSIONS };
