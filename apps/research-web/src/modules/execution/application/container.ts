/**
 * Composition root for the Execution Module. The single place a concrete
 * repository is bound. Replace MockExecutionRepository with
 * `new ApiExecutionRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockExecutionRepository } from '../data/mock-repository';
import { ExecutionService } from './execution-service';

export const executionService = new ExecutionService(new MockExecutionRepository());
