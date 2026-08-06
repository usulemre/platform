/**
 * Composition root for the Experiment Module. The single place a concrete
 * repository is bound. Replace MockExperimentRepository with
 * `new ApiExperimentRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockExperimentRepository } from '../data/mock-repository';
import { ExperimentService } from './experiment-service';

export const experimentService = new ExperimentService(new MockExperimentRepository());
