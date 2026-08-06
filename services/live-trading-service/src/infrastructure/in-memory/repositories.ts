/**
 * In-memory read-model adapters. Development/test only — no persistence, no cache, no
 * database. They implement the query ports over the synthetic seed.
 */
import type {
  Deployment,
  DeploymentFamily,
  TradingAccount,
  BrokerConnection,
} from '@platform/trading-sdk';
import type {
  AccountQueryPort,
  ConnectionQueryPort,
  DeploymentQueryPort,
  FamilyQueryPort,
} from '../ports';
import { ACCOUNTS, CONNECTIONS, DEPLOYMENTS, FAMILIES } from './seed';

export class InMemoryDeploymentQuery implements DeploymentQueryPort {
  constructor(private readonly data: readonly Deployment[] = DEPLOYMENTS) {}
  async list(): Promise<readonly Deployment[]> {
    return this.data;
  }
  async getById(id: string): Promise<Deployment | null> {
    return this.data.find((deployment) => deployment.id === id) ?? null;
  }
}

export class InMemoryFamilyQuery implements FamilyQueryPort {
  constructor(private readonly data: readonly DeploymentFamily[] = FAMILIES) {}
  async list(): Promise<readonly DeploymentFamily[]> {
    return this.data;
  }
}

export class InMemoryAccountQuery implements AccountQueryPort {
  constructor(private readonly data: readonly TradingAccount[] = ACCOUNTS) {}
  async list(): Promise<readonly TradingAccount[]> {
    return this.data;
  }
}

export class InMemoryConnectionQuery implements ConnectionQueryPort {
  constructor(private readonly data: readonly BrokerConnection[] = CONNECTIONS) {}
  async list(): Promise<readonly BrokerConnection[]> {
    return this.data;
  }
}
