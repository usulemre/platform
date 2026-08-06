/**
 * TCA repository boundary — the ONLY data abstraction the application service depends on. Concrete
 * adapters implement it; the UI never sees a concrete data source and never touches the service tier,
 * an exchange, a broker, a credential, or persistence. It returns raw post-trade execution records;
 * the analysis is performed (with the real SDK) in the application service.
 */
import type { ExecutionInput } from '@platform/tca-sdk';
import type { ExecutionQuery } from '../domain/query';

export type { ExecutionQuery };

export interface TcaRepository {
  listExecutions(query: ExecutionQuery): Promise<readonly ExecutionInput[]>;
  listAll(): Promise<readonly ExecutionInput[]>;
  getExecution(id: string): Promise<ExecutionInput | null>;
}
