/**
 * In-memory mock adapter for the TCA UI. Synthetic post-trade execution DATA only — NO exchange/broker
 * SDK, NO API keys, NO HTTP/WebSocket/FIX, NO connectivity, no persistence. This is the UI's own mock,
 * independent of the service tier. Analysis of this data is REAL (from `@platform/tca-sdk`).
 */
import type { ExecutionInput } from '@platform/tca-sdk';
import { applyExecutionQuery, type ExecutionQuery } from '../domain/query';
import type { TcaRepository } from './repository';
import { EXECUTIONS } from './seed';

export class MockTcaRepository implements TcaRepository {
  async listExecutions(query: ExecutionQuery): Promise<readonly ExecutionInput[]> {
    return applyExecutionQuery(EXECUTIONS, query);
  }
  async listAll(): Promise<readonly ExecutionInput[]> {
    return EXECUTIONS;
  }
  async getExecution(id: string): Promise<ExecutionInput | null> {
    return EXECUTIONS.find((e) => e.id === id) ?? null;
  }
}

export { EXECUTIONS };
