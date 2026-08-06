/**
 * Signal application service — the ONLY layer the UI/hooks call. Orchestrates the
 * repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no
 * signal generation, no trading/execution. Signals are advisory; lifecycle and
 * any execution eligibility are governed elsewhere (WCON-2, Execution Governance).
 */
import type { SignalDetailVm, SignalListItemVm, SignalSummaryVm } from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { SignalQuery } from '../domain/query';
import type { SignalRepository } from '../data/repository';

export class SignalService {
  constructor(private readonly repository: SignalRepository) {}

  async listSignals(query: SignalQuery = {}): Promise<SignalListItemVm[]> {
    const signals = await this.repository.list(query);
    return signals.map(toListItemVm);
  }

  async getSignal(id: string): Promise<SignalDetailVm | null> {
    const signal = await this.repository.getById(id);
    return signal ? toDetailVm(signal) : null;
  }

  async getSummary(): Promise<SignalSummaryVm> {
    const signals = await this.repository.list({});
    return toSummaryVm(signals);
  }
}
