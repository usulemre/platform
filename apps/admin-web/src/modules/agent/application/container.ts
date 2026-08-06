/**
 * Composition root for the Agent Module. The single place a concrete repository
 * is bound. Replace MockAgentRepository with `new ApiAgentRepository(apiClient)`
 * (over the Agent Registry) to go live — no UI/hook/service changes.
 */
import { MockAgentRepository } from '../data/mock-repository';
import { AgentService } from './agent-service';

export const agentService = new AgentService(new MockAgentRepository());
