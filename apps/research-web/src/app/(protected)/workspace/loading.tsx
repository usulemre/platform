import { WorkspaceLoadingState } from '@/modules/workspace';

/** Route-level loading state for the workspace segment. */
export default function WorkspaceLoading() {
  return <WorkspaceLoadingState rows={6} />;
}
