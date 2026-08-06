/**
 * Execution Simulator repository boundary — the ONLY data abstraction the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete data
 * source and never touches the service tier, a broker, an exchange, a simulator, or
 * persistence.
 */
import type {
  SimulationSession,
  SimulationComparison,
  SimulationFamily,
  ScenarioTemplate,
} from '@platform/execution-sdk';
import type { SessionQuery } from '../domain/query';

export type { SessionQuery };

export interface ExecutionSimulatorRepository {
  listSessions(query: SessionQuery): Promise<readonly SimulationSession[]>;
  getSession(id: string): Promise<SimulationSession | null>;
  listFamilies(): Promise<readonly SimulationFamily[]>;
  listTemplates(): Promise<readonly ScenarioTemplate[]>;
  executionQueue(): Promise<readonly SimulationSession[]>;
  reviewQueue(): Promise<readonly SimulationSession[]>;
  approvalQueue(): Promise<readonly SimulationSession[]>;
  history(): Promise<readonly SimulationSession[]>;
  listComparisons(): Promise<readonly SimulationComparison[]>;
  getComparison(id: string): Promise<SimulationComparison | null>;
}
