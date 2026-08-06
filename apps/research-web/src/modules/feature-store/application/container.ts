/**
 * Composition root for the Feature Store UI module. The single place a concrete
 * repository is bound. Replace MockFeatureStoreRepository with
 * `new ApiFeatureStoreRepository(apiClient)` (over the feature-store service
 * gateway) to go live — no UI/hook/service changes.
 */
import { MockFeatureStoreRepository } from '../data/mock-repository';
import { FeatureStoreAdminService } from './feature-store-service';

export const featureStoreAdminService = new FeatureStoreAdminService(
  new MockFeatureStoreRepository(),
);
