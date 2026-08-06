/**
 * Feature Store application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no feature calculations, no statistics, no persistence.
 * Aggregation is pure.
 */
import { toCatalogItemVm, toDetailVm, toFamilyVm, toSummaryVm } from '../domain/mappers';
import type { FeatureQuery } from '../domain/query';
import type {
  FeatureCatalogItemVm,
  FeatureDetailVm,
  FeatureFamilyVm,
  FeatureStoreSummaryVm,
} from '../domain/view-model';
import type { FeatureStoreRepository } from '../data/repository';

export class FeatureStoreAdminService {
  constructor(private readonly repository: FeatureStoreRepository) {}

  async listFeatures(query: FeatureQuery = {}): Promise<FeatureCatalogItemVm[]> {
    return (await this.repository.listFeatures(query)).map(toCatalogItemVm);
  }

  async getFeature(id: string): Promise<FeatureDetailVm | null> {
    const feature = await this.repository.getFeature(id);
    return feature ? toDetailVm(feature) : null;
  }

  async listFamilies(): Promise<FeatureFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async getSummary(): Promise<FeatureStoreSummaryVm> {
    const [features, families] = await Promise.all([
      this.repository.listFeatures({}),
      this.repository.listFamilies(),
    ]);
    return toSummaryVm(features, families);
  }
}
