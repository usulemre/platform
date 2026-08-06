/**
 * Real adapter over the governed API gateway (live-trading service). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never infrastructure,
 * never a broker, never an exchange, never a credential, never persistence, never
 * HTTP/WebSocket/FIX beyond the governed gateway request.
 */
import type { ApiClient } from '@platform/api-client';
import type {
  Deployment,
  DeploymentFamily,
  TradingAccount,
  BrokerConnection,
  ProviderDescriptor,
} from '@platform/trading-sdk';
import type { DeploymentQuery } from '../domain/query';
import type { LiveTradingRepository } from './repository';

function buildQueryString(query: DeploymentQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiLiveTradingRepository implements LiveTradingRepository {
  constructor(private readonly api: ApiClient) {}

  listDeployments(query: DeploymentQuery): Promise<readonly Deployment[]> {
    return this.api.request<readonly Deployment[]>(
      `/live-trading/deployments${buildQueryString(query)}`,
    );
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    try {
      return await this.api.request<Deployment>(`/live-trading/deployments/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly DeploymentFamily[]> {
    return this.api.request<readonly DeploymentFamily[]>('/live-trading/families');
  }

  listAccounts(): Promise<readonly TradingAccount[]> {
    return this.api.request<readonly TradingAccount[]>('/live-trading/accounts');
  }

  listConnections(): Promise<readonly BrokerConnection[]> {
    return this.api.request<readonly BrokerConnection[]>('/live-trading/connections');
  }

  listProviders(): Promise<readonly ProviderDescriptor[]> {
    return this.api.request<readonly ProviderDescriptor[]>('/live-trading/providers');
  }

  runningStrategies(): Promise<readonly Deployment[]> {
    return this.api.request<readonly Deployment[]>('/live-trading/running');
  }

  approvalQueue(): Promise<readonly Deployment[]> {
    return this.api.request<readonly Deployment[]>('/live-trading/queues/approval');
  }

  deploymentHistory(): Promise<readonly Deployment[]> {
    return this.api.request<readonly Deployment[]>('/live-trading/history');
  }
}
