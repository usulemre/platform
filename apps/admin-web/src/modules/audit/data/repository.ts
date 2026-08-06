/**
 * Audit repository abstraction — the ONLY data boundary the application service
 * depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches infrastructure. Read-only: the platform emits audit
 * events; this module never writes them.
 */
import type { AuditEventDto, Page } from '../domain/dto';
import type { AuditQuery } from '../domain/query';

export type { AuditQuery };

export interface AuditRepository {
  list(query: AuditQuery): Promise<Page<AuditEventDto>>;
  getById(id: string): Promise<AuditEventDto | null>;
  all(): Promise<readonly AuditEventDto[]>;
}
