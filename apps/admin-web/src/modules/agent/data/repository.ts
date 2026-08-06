/**
 * Agent repository abstraction — the ONLY data boundary the application service
 * depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches infrastructure.
 */
import type { AgentDto } from '../domain/dto';
import type { AgentQuery } from '../domain/query';

export type { AgentQuery };

export interface AgentRepository {
  list(query: AgentQuery): Promise<readonly AgentDto[]>;
  getById(id: string): Promise<AgentDto | null>;
}
