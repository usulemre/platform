/**
 * Composition root for the Feature Module. The single place a concrete repository
 * is bound. Replace MockFeatureRepository with
 * `new ApiFeatureRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockFeatureRepository } from '../data/mock-repository';
import { FeatureService } from './feature-service';

export const featureService = new FeatureService(new MockFeatureRepository());
