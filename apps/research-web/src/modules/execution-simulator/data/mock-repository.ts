/**
 * In-memory mock adapter for the Execution Simulator UI. Synthetic simulation METADATA
 * ONLY — NO execution algorithm, NO exchange/broker connectivity, NO FIX, NO WebSocket,
 * NO fill/price/PnL computation, no persistence. Portfolio/strategy/backtest references
 * use the other modules' ids so cross-links resolve; quantities, prices, exposures and
 * metric VALUES are inert strings. This is the UI's own mock, independent of the service
 * tier.
 */
import {
  isActiveRun,
  type SimulationSession,
  type SimulationComparison,
  type SimulationFamily,
  type ScenarioTemplate,
} from '@platform/execution-sdk';
import { applySessionQuery, type SessionQuery } from '../domain/query';
import type { ExecutionSimulatorRepository } from './repository';
import { EXECUTION_SIMULATOR_SEED } from './seed';

const {
  sessions: SESSIONS,
  families: FAMILIES,
  templates: TEMPLATES,
  comparisons: COMPARISONS,
} = EXECUTION_SIMULATOR_SEED;

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockExecutionSimulatorRepository implements ExecutionSimulatorRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listSessions(query: SessionQuery): Promise<readonly SimulationSession[]> {
    await this.delay();
    return applySessionQuery(SESSIONS, query);
  }

  async getSession(id: string): Promise<SimulationSession | null> {
    await this.delay();
    return SESSIONS.find((session) => session.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly SimulationFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async listTemplates(): Promise<readonly ScenarioTemplate[]> {
    await this.delay();
    return TEMPLATES;
  }

  async executionQueue(): Promise<readonly SimulationSession[]> {
    await this.delay();
    return SESSIONS.filter((session) => isActiveRun(session.run.status));
  }

  async reviewQueue(): Promise<readonly SimulationSession[]> {
    await this.delay();
    return SESSIONS.filter(
      (session) =>
        session.stage === 'REVIEW' || session.reviews.some((r) => r.status === 'PENDING'),
    );
  }

  async approvalQueue(): Promise<readonly SimulationSession[]> {
    await this.delay();
    return SESSIONS.filter((session) =>
      session.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  async history(): Promise<readonly SimulationSession[]> {
    await this.delay();
    return SESSIONS.filter(
      (session) => session.run.status === 'COMPLETED' || session.stage === 'ARCHIVED',
    );
  }

  async listComparisons(): Promise<readonly SimulationComparison[]> {
    await this.delay();
    return COMPARISONS;
  }

  async getComparison(id: string): Promise<SimulationComparison | null> {
    await this.delay();
    return COMPARISONS.find((comparison) => comparison.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export { EXECUTION_SIMULATOR_SEED };
