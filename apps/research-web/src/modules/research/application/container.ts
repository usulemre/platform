/**
 * Composition root for the Research Engine UI module. The single place a concrete
 * repository is bound. Replace MockResearchRepository with
 * `new ApiResearchRepository(apiClient)` (over the research service gateway) to go
 * live — no UI/hook/service changes.
 */
import { MockResearchRepository } from '../data/mock-repository';
import { ResearchAdminService } from './research-service';

export const researchAdminService = new ResearchAdminService(new MockResearchRepository());
