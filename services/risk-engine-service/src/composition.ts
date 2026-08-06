/**
 * Composition root for the risk-engine service. The single place concrete adapters are
 * bound. In v1 only the in-memory mocks are wired; swapping in real infrastructure
 * adapters (Portfolio Construction Engine, Risk Model, Validation Foundation, Workflow
 * Engine, Event & Messaging Foundation, Audit Center, Notification Center,
 * Configuration Foundation, read stores) requires no application/domain change.
 */
import { RiskEngineService } from './application/risk-engine-service';
import {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  StaticConfiguration,
  StubPortfolio,
  StubRiskModel,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryAssessmentQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemoryPolicyQuery,
} from './infrastructure/in-memory/repositories';

export function createRiskEngineService(): RiskEngineService {
  return new RiskEngineService({
    assessments: new InMemoryAssessmentQuery(),
    families: new InMemoryFamilyQuery(),
    comparisons: new InMemoryComparisonQuery(),
    policies: new InMemoryPolicyQuery(),
    portfolio: new StubPortfolio(),
    riskModel: new StubRiskModel(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    audit: new InMemoryAudit(),
    notifications: new InMemoryNotifications(),
    config: new StaticConfiguration({ 'risk.default-mandate': 'institutional' }),
  });
}

export const riskEngineService = createRiskEngineService();
