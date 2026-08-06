/**
 * Composition root for the research service. The single place concrete adapters
 * are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (module integrations, Validation Foundation, Workflow
 * Engine, Event & Messaging Foundation, Configuration Foundation, read stores)
 * requires no application/domain change.
 */
import { ResearchService } from './application/research-service';
import {
  InMemoryEventBus,
  StaticConfiguration,
  StubModuleArtifacts,
  StubValidation,
  StubWorkflow,
  StubWorkspace,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryProjectQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';

export function createResearchService(): ResearchService {
  return new ResearchService({
    projects: new InMemoryProjectQuery(),
    templates: new InMemoryTemplateQuery(),
    artifacts: new StubModuleArtifacts(),
    workspace: new StubWorkspace(),
    validation: new StubValidation(),
    workflow: new StubWorkflow(),
    bus: new InMemoryEventBus(),
    config: new StaticConfiguration({ 'research.default-template': 'TPL-FULL' }),
  });
}

export const researchService = createResearchService();
