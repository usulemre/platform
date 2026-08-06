/**
 * Shared research status vocabularies, used identically across the research
 * service and its researcher-facing UI.
 */
export type ProjectStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'REJECTED';

export type StageState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED';

export type ObjectiveStatus = 'OPEN' | 'IN_PROGRESS' | 'MET' | 'MISSED';

export type ApprovalStatus = 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type MilestoneStatus = 'PENDING' | 'REACHED' | 'MISSED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'BLOCKED';

/** A project that is progressing (not terminal, not paused). */
export function isActive(status: ProjectStatus): boolean {
  return status === 'ACTIVE' || status === 'DRAFT';
}

/** A stage that is finished. */
export function isStageDone(state: StageState): boolean {
  return state === 'COMPLETE';
}
