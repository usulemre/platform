/**
 * Execution application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no
 * broker/exchange connectivity, no order routing. Approval, authorization and
 * lifecycle transitions run through governed workflows / Execution Governance
 * (WCON-2) — never here.
 */
import type {
  ExecutionDetailVm,
  ExecutionListItemVm,
  ExecutionSummaryVm,
} from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { ExecutionQuery } from '../domain/query';
import type { ExecutionRepository } from '../data/repository';

export class ExecutionService {
  constructor(private readonly repository: ExecutionRepository) {}

  async listRequests(query: ExecutionQuery = {}): Promise<ExecutionListItemVm[]> {
    const requests = await this.repository.list(query);
    return requests.map(toListItemVm);
  }

  async getRequest(id: string): Promise<ExecutionDetailVm | null> {
    const request = await this.repository.getById(id);
    return request ? toDetailVm(request) : null;
  }

  async getSummary(): Promise<ExecutionSummaryVm> {
    const requests = await this.repository.list({});
    return toSummaryVm(requests);
  }
}
