/**
 * Composition root for the Execution Simulator UI module (research-web). The single
 * place a concrete repository is bound. Replace MockExecutionSimulatorRepository with
 * `new ApiExecutionSimulatorRepository(apiClient)` (over the execution-simulator service
 * gateway) to go live — no UI/hook/service changes.
 */
import { MockExecutionSimulatorRepository } from '../data/mock-repository';
import { ExecutionSimulatorAdminService } from './execution-simulator-service';

export const executionSimulatorAdminService = new ExecutionSimulatorAdminService(
  new MockExecutionSimulatorRepository(),
);
