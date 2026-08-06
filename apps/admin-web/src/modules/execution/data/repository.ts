/**
 * Execution repository boundary — the ONLY data abstraction the application service depends on.
 * Concrete adapters implement it; the UI never sees a concrete data source and never touches the
 * service tier, a broker, an exchange, a credential, or persistence.
 */
import type { Execution, ExecutionSession } from '@platform/execution-engine-sdk';
import type { ExecutionQuery } from '../domain/query';

export type { ExecutionQuery };

export interface ExecutionRepository {
  listExecutions(query: ExecutionQuery): Promise<readonly Execution[]>;
  listAll(): Promise<readonly Execution[]>;
  getExecution(id: string): Promise<Execution | null>;
  listSessions(): Promise<readonly ExecutionSession[]>;
}
