/**
 * Composition root for the Connector Management Platform. The single place a
 * concrete repository is bound. Replace MockConnectorRepository with
 * `new ApiConnectorRepository(apiClient)` (over the Connector Registry gateway)
 * to go live — no UI/hook/service changes.
 */
import { MockConnectorRepository } from '../data/mock-repository';
import { ConnectorService } from './connector-service';

export const connectorService = new ConnectorService(new MockConnectorRepository());
