/**
 * Connector Registry boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches infrastructure or a provider SDK.
 */
import type { ConnectorDto } from '../domain/dto';
import type { ConnectorQuery } from '../domain/query';

export type { ConnectorQuery };

export interface ConnectorRepository {
  list(query: ConnectorQuery): Promise<readonly ConnectorDto[]>;
  getById(id: string): Promise<ConnectorDto | null>;
}
