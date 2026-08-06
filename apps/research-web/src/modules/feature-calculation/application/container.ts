/**
 * Composition root for the Feature Calculation UI module. Binds the mock repository (which runs
 * the REAL SDK calculations over synthetic datasets). Swap in an API-backed repository over the
 * feature-calculation service gateway to compute against live datasets — no UI/hook change.
 */
import { MockFeatureCalculationRepository } from '../data/mock-repository';
import { FeatureCalculationAdminService } from './feature-calculation-service';

export const featureCalculationAdminService = new FeatureCalculationAdminService(
  new MockFeatureCalculationRepository(),
);
