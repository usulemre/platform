/**
 * Composition root for the Execution UI module (trading-web). The single place a concrete repository
 * is bound. Replace MockExecutionRepository with an API-backed repository over the execution-engine
 * service gateway to go live — no UI/hook/service changes.
 */
import { MockExecutionRepository } from '../data/mock-repository';
import { ExecutionAdminService } from './execution-service';

export const executionAdminService = new ExecutionAdminService(new MockExecutionRepository());
