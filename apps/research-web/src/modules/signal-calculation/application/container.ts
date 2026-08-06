/**
 * Composition root for the Signal Calculation UI module. Binds the mock repository (which runs the
 * REAL SDK generators over synthetic datasets). Swap in an API-backed repository over the
 * signal-calculation service gateway to compute against live datasets — no UI/hook change.
 */
import { MockSignalCalculationRepository } from '../data/mock-repository';
import { SignalCalculationAdminService } from './signal-calculation-service';

export const signalCalculationAdminService = new SignalCalculationAdminService(
  new MockSignalCalculationRepository(),
);
