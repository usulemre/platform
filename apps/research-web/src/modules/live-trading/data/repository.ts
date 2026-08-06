/**
 * Live Trading Platform repository boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches the service tier, a broker, an exchange, a credential, or
 * persistence.
 */
import type {
  Deployment,
  DeploymentFamily,
  TradingAccount,
  BrokerConnection,
  ProviderDescriptor,
} from '@platform/trading-sdk';
import type { DeploymentQuery } from '../domain/query';

export type { DeploymentQuery };

export interface LiveTradingRepository {
  listDeployments(query: DeploymentQuery): Promise<readonly Deployment[]>;
  getDeployment(id: string): Promise<Deployment | null>;
  listFamilies(): Promise<readonly DeploymentFamily[]>;
  listAccounts(): Promise<readonly TradingAccount[]>;
  listConnections(): Promise<readonly BrokerConnection[]>;
  listProviders(): Promise<readonly ProviderDescriptor[]>;
  runningStrategies(): Promise<readonly Deployment[]>;
  approvalQueue(): Promise<readonly Deployment[]>;
  deploymentHistory(): Promise<readonly Deployment[]>;
}
