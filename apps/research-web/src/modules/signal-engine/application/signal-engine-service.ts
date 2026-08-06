/**
 * Signal Engine application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no alpha models, no signal calculations, no statistics, no ML,
 * no persistence. Aggregation is pure.
 */
import {
  toApprovalQueueItemVm,
  toCatalogItemVm,
  toDetailVm,
  toFamilyVm,
  toPromotionQueueItemVm,
  toSummaryVm,
} from '../domain/mappers';
import type { SignalQuery } from '../domain/query';
import type {
  QueueItemVm,
  SignalCatalogItemVm,
  SignalDetailVm,
  SignalEngineSummaryVm,
  SignalFamilyVm,
} from '../domain/view-model';
import type { SignalEngineRepository } from '../data/repository';

export class SignalEngineAdminService {
  constructor(private readonly repository: SignalEngineRepository) {}

  async listSignals(query: SignalQuery = {}): Promise<SignalCatalogItemVm[]> {
    return (await this.repository.listSignals(query)).map(toCatalogItemVm);
  }

  async getSignal(id: string): Promise<SignalDetailVm | null> {
    const signal = await this.repository.getSignal(id);
    return signal ? toDetailVm(signal) : null;
  }

  async listFamilies(): Promise<SignalFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async getPromotionQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.promotionQueue()).map(toPromotionQueueItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  async getSummary(): Promise<SignalEngineSummaryVm> {
    const [signals, families] = await Promise.all([
      this.repository.listSignals({}),
      this.repository.listFamilies(),
    ]);
    return toSummaryVm(signals, families);
  }
}
