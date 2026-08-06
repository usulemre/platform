/**
 * Composition root for the Signal Module. The single place a concrete repository
 * is bound. Replace MockSignalRepository with `new ApiSignalRepository(apiClient)`
 * to go live — no UI/hook/service changes.
 */
import { MockSignalRepository } from '../data/mock-repository';
import { SignalService } from './signal-service';

export const signalService = new SignalService(new MockSignalRepository());
