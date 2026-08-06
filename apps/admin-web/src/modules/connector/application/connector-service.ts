/**
 * Connector application service — the ONLY layer the UI/hooks call. Orchestrates
 * the Connector Registry repository, maps canonical DTOs to view models, and
 * computes the dashboard summary (pure aggregation — NOT statistics). No
 * infrastructure, no UI, no provider SDK, no network communication.
 *
 * Lifecycle transitions (register, configure, enable, maintenance, deprecate,
 * retire) and any real connection run through governed processes / future
 * infrastructure — never here.
 */
import type {
  ConnectorDetailVm,
  ConnectorListItemVm,
  ConnectorSummaryVm,
} from '../domain/view-model';
import { toDetailVm, toListItemVm, toSummaryVm } from '../domain/mappers';
import { connectorFactory, type ConnectorTypeDescriptor } from '../domain/catalog';
import type { ConnectorQuery } from '../domain/query';
import type { ConnectorRepository } from '../data/repository';

export class ConnectorService {
  constructor(private readonly repository: ConnectorRepository) {}

  async listConnectors(query: ConnectorQuery = {}): Promise<ConnectorListItemVm[]> {
    const connectors = await this.repository.list(query);
    return connectors.map(toListItemVm);
  }

  async getConnector(id: string): Promise<ConnectorDetailVm | null> {
    const connector = await this.repository.getById(id);
    return connector ? toDetailVm(connector) : null;
  }

  async getSummary(): Promise<ConnectorSummaryVm> {
    const connectors = await this.repository.list({});
    return toSummaryVm(connectors);
  }

  /** The supported connector-type catalog (abstractions only, via the factory). */
  listConnectorTypes(): readonly ConnectorTypeDescriptor[] {
    return connectorFactory.listTypes();
  }
}
