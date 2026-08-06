/**
 * Composition root for the Audit Center. The single place a concrete repository
 * is bound. Replace MockAuditRepository with `new ApiAuditRepository(apiClient)`
 * to go live — no UI/hook/service changes.
 */
import { MockAuditRepository } from '../data/mock-repository';
import { AuditService } from './audit-service';

export const auditService = new AuditService(new MockAuditRepository());
