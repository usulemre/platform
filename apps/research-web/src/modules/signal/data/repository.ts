/**
 * Signal repository abstraction — the ONLY data boundary the application service
 * depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches infrastructure.
 */
import type { SignalDto } from '../domain/dto';
import type { SignalQuery } from '../domain/query';

export type { SignalQuery };

export interface SignalRepository {
  list(query: SignalQuery): Promise<readonly SignalDto[]>;
  getById(id: string): Promise<SignalDto | null>;
}
