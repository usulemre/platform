/**
 * Audit application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository, maps DTOs to view models, and computes the dashboard summary (pure
 * aggregation — counting only). No infrastructure, no UI, no persistence, no
 * event storage, no logging. Read-only traceability.
 */
import { toDetailVm, toPageVm, toSummaryVm } from '../domain/mappers';
import type { AuditQuery } from '../domain/query';
import type { AuditEventDetailVm, AuditPageVm, AuditSummaryVm } from '../domain/view-model';
import type { AuditRepository } from '../data/repository';

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async listEvents(query: AuditQuery = {}): Promise<AuditPageVm> {
    return toPageVm(await this.repository.list(query));
  }

  async getEvent(id: string): Promise<AuditEventDetailVm | null> {
    const event = await this.repository.getById(id);
    return event ? toDetailVm(event) : null;
  }

  async getSummary(): Promise<AuditSummaryVm> {
    return toSummaryVm(await this.repository.all());
  }
}
