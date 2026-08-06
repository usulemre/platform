/**
 * In-memory mock adapter for the Live Trading Platform UI. Synthetic deployment METADATA
 * ONLY — NO exchange/broker SDK, NO API keys, NO HTTP/WebSocket/FIX, NO order execution,
 * NO PnL/exposure computation, no persistence. Strategy/portfolio/simulation references use
 * the other modules' ids so cross-links resolve; credentials are opaque `credentialRef`
 * strings; quantities, prices, balances and metric VALUES are inert strings. This is the
 * UI's own mock, independent of the service tier.
 */
import {
  PROVIDERS,
  isActiveDeployment,
  type Deployment,
  type DeploymentFamily,
  type TradingAccount,
  type BrokerConnection,
  type ProviderDescriptor,
} from '@platform/trading-sdk';
import { applyDeploymentQuery, type DeploymentQuery } from '../domain/query';
import type { LiveTradingRepository } from './repository';
import { LIVE_TRADING_SEED } from './seed';

const {
  deployments: DEPLOYMENTS,
  families: FAMILIES,
  accounts: ACCOUNTS,
  connections: CONNECTIONS,
} = LIVE_TRADING_SEED;

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockLiveTradingRepository implements LiveTradingRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listDeployments(query: DeploymentQuery): Promise<readonly Deployment[]> {
    await this.delay();
    return applyDeploymentQuery(DEPLOYMENTS, query);
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    await this.delay();
    return DEPLOYMENTS.find((deployment) => deployment.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly DeploymentFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async listAccounts(): Promise<readonly TradingAccount[]> {
    await this.delay();
    return ACCOUNTS;
  }

  async listConnections(): Promise<readonly BrokerConnection[]> {
    await this.delay();
    return CONNECTIONS;
  }

  async listProviders(): Promise<readonly ProviderDescriptor[]> {
    await this.delay();
    return PROVIDERS;
  }

  async runningStrategies(): Promise<readonly Deployment[]> {
    await this.delay();
    return DEPLOYMENTS.filter((deployment) => isActiveDeployment(deployment.runtime.status));
  }

  async approvalQueue(): Promise<readonly Deployment[]> {
    await this.delay();
    return DEPLOYMENTS.filter((deployment) =>
      deployment.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  async deploymentHistory(): Promise<readonly Deployment[]> {
    await this.delay();
    return DEPLOYMENTS.filter(
      (deployment) => deployment.stage === 'STOPPED' || deployment.stage === 'ARCHIVED',
    );
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export { LIVE_TRADING_SEED };
