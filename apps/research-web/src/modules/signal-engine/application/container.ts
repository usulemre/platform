/**
 * Composition root for the Signal Engine UI module. The single place a concrete
 * repository is bound. Replace MockSignalEngineRepository with
 * `new ApiSignalEngineRepository(apiClient)` (over the signal-engine service
 * gateway) to go live — no UI/hook/service changes.
 */
import { MockSignalEngineRepository } from '../data/mock-repository';
import { SignalEngineAdminService } from './signal-engine-service';

export const signalEngineAdminService = new SignalEngineAdminService(
  new MockSignalEngineRepository(),
);
