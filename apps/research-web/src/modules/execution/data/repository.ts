/**
 * Execution request repository abstraction — the ONLY data boundary the
 * application service depends on. Concrete adapters implement it; the UI never
 * sees a concrete data source and never touches infrastructure, brokers or
 * exchanges.
 */
import type { ExecutionRequestDto } from '../domain/dto';
import type { ExecutionQuery } from '../domain/query';

export type { ExecutionQuery };

export interface ExecutionRepository {
  list(query: ExecutionQuery): Promise<readonly ExecutionRequestDto[]>;
  getById(id: string): Promise<ExecutionRequestDto | null>;
}
