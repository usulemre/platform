/**
 * Composition root for the Monitoring Module. The single place a concrete
 * repository is bound. Replace MockMonitoringRepository with
 * `new ApiMonitoringRepository(apiClient)` (over the Monitoring Service) to go
 * live — no UI/hook/service changes.
 */
import { MockMonitoringRepository } from '../data/mock-repository';
import { MonitoringService } from './monitoring-service';

export const monitoringService = new MonitoringService(new MockMonitoringRepository());
