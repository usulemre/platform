/**
 * Composition root for the Research Workspace. The single place a concrete
 * repository is bound. Replace MockWorkspaceRepository with
 * `new ApiWorkspaceRepository(apiClient)` to go live — no UI/hook/service changes.
 */
import { MockWorkspaceRepository } from '../data/mock-repository';
import { WorkspaceService } from './workspace-service';

export const workspaceService = new WorkspaceService(new MockWorkspaceRepository());
