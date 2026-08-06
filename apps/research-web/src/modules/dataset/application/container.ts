/**
 * Composition root for the Dataset Module. This is the single place a concrete
 * repository is bound. To go live, replace MockDatasetRepository with
 * `new ApiDatasetRepository(apiClient)` (from `@/lib/auth`) — no UI, hook or
 * service changes are required.
 */
import { MockDatasetRepository } from '../data/mock-repository';
import { DatasetService } from './dataset-service';

export const datasetService = new DatasetService(new MockDatasetRepository());
