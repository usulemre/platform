/**
 * @services/research-service — the canonical Research Engine.
 *
 * Coordinates the complete research lifecycle (hypothesis → approval) across the
 * dataset, feature, signal, strategy and portfolio modules, the Market Data
 * Platform and the Research Workspace — through infrastructure INTERFACES only.
 * It has a domain layer (pure lifecycle rules, dependencies, the ResearchProject
 * aggregate), an application layer, and infrastructure ports; the only adapters
 * shipped in v1 are in-memory mocks. No quantitative algorithms, no statistics,
 * no persistence, no direct infrastructure access.
 */
export * from './domain/lifecycle-rules';
export * from './domain/dependencies';
export * from './domain/research-project';

export * from './application/research-service';

export * from './infrastructure/ports';
export {
  InMemoryProjectQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { PROJECTS, TEMPLATES, MODULE_ARTIFACTS } from './infrastructure/in-memory/seed';

export * from './composition';
