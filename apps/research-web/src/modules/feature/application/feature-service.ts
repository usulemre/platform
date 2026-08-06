/**
 * Feature application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository, maps canonical DTOs to view models, and computes the dashboard
 * summary (pure aggregation — NOT statistics). No infrastructure, no UI, no
 * feature calculation. Lifecycle transitions (registration, approval, retirement)
 * run through governed workflows (WCON-2), not this service; v1 is read-only.
 */
import type { FeatureDetailVm, FeatureListItemVm, FeatureSummaryVm } from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import type { FeatureQuery } from '../domain/query';
import type { FeatureRepository } from '../data/repository';

export class FeatureService {
  constructor(private readonly repository: FeatureRepository) {}

  async listFeatures(query: FeatureQuery = {}): Promise<FeatureListItemVm[]> {
    const features = await this.repository.list(query);
    return features.map(toListItemVm);
  }

  async getFeature(id: string): Promise<FeatureDetailVm | null> {
    const feature = await this.repository.getById(id);
    return feature ? toDetailVm(feature) : null;
  }

  async getSummary(): Promise<FeatureSummaryVm> {
    const features = await this.repository.list({});
    return toSummaryVm(features);
  }
}
