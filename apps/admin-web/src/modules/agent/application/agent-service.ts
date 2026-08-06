/**
 * Agent application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no LLM
 * provider, no model inference, no prompt execution. Lifecycle transitions
 * (registration, evaluation, suspension, retirement) run through governed
 * processes (WCON-2 / AI Governance) — never here.
 */
import type { AgentDetailVm, AgentListItemVm, AgentSummaryVm } from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { AgentQuery } from '../domain/query';
import type { AgentRepository } from '../data/repository';

export class AgentService {
  constructor(private readonly repository: AgentRepository) {}

  async listAgents(query: AgentQuery = {}): Promise<AgentListItemVm[]> {
    const agents = await this.repository.list(query);
    return agents.map(toListItemVm);
  }

  async getAgent(id: string): Promise<AgentDetailVm | null> {
    const agent = await this.repository.getById(id);
    return agent ? toDetailVm(agent) : null;
  }

  async getSummary(): Promise<AgentSummaryVm> {
    const agents = await this.repository.list({});
    return toSummaryVm(agents);
  }
}
