/**
 * Composition root for the Performance Analytics Engine UI module (research-web). The single
 * place a concrete repository is bound. Replace MockPerformanceRepository with
 * `new ApiPerformanceRepository(apiClient)` (over the performance-analytics service gateway)
 * to go live — no UI/hook/service changes.
 */
import { MockPerformanceRepository } from '../data/mock-repository';
import { PerformanceAdminService } from './performance-analytics-service';

export const performanceAdminService = new PerformanceAdminService(new MockPerformanceRepository());
