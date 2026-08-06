/**
 * Composition root for the SOR UI module (trading-web). The single place a concrete repository is
 * bound. Replace MockSorRepository with an API-backed repository over the smart-order-router service
 * gateway to go live — no UI/hook/service changes.
 */
import { MockSorRepository } from '../data/mock-repository';
import { SorAdminService } from './sor-service';

export const sorAdminService = new SorAdminService(new MockSorRepository());
