/**
 * Pure research-lifecycle rules. Deterministic, no IO, no time access (the clock
 * is injected). These enforce the scientific method as a gated pipeline: stages
 * advance in order and MAY NOT be skipped (CLAUDE.md SM, RL-1). No quantitative
 * algorithms, no statistics — only ordering/state logic.
 */
import {
  isStageDone,
  stageOrder,
  type ProgressInfo,
  type ResearchStage,
  type StageProgress,
} from '@platform/research-sdk';

function byOrder(a: StageProgress, b: StageProgress): number {
  return stageOrder(a.stage) - stageOrder(b.stage);
}

/** The stage a researcher is currently working (in-progress/blocked, else the
 *  first pending, else the final stage when everything is complete). */
export function currentStage(stages: readonly StageProgress[]): ResearchStage {
  const sorted = [...stages].sort(byOrder);
  const active = sorted.find((s) => s.state === 'IN_PROGRESS' || s.state === 'BLOCKED');
  if (active) return active.stage;
  const pending = sorted.find((s) => s.state === 'PENDING');
  if (pending) return pending.stage;
  return sorted[sorted.length - 1]!.stage;
}

/** True when a COMPLETE stage appears after a non-COMPLETE one (an illegal skip). */
export function hasSkipViolation(stages: readonly StageProgress[]): boolean {
  let seenIncomplete = false;
  for (const stage of [...stages].sort(byOrder)) {
    if (stage.state !== 'COMPLETE') seenIncomplete = true;
    else if (seenIncomplete) return true;
  }
  return false;
}

/** A project can advance unless it is blocked or already fully complete. */
export function canAdvance(stages: readonly StageProgress[]): boolean {
  const sorted = [...stages].sort(byOrder);
  if (sorted.some((s) => s.state === 'BLOCKED')) return false;
  return sorted.some((s) => s.state === 'IN_PROGRESS' || s.state === 'PENDING');
}

export interface AdvanceResult {
  readonly stages: readonly StageProgress[];
  readonly advancedTo: ResearchStage | null;
  readonly changed: boolean;
}

/**
 * Advance the lifecycle by one step, in order and without skipping. Completes the
 * current in-progress stage and starts the next pending stage; if nothing is in
 * progress, starts the first pending stage. Blocked projects do not advance.
 */
export function advance(stages: readonly StageProgress[], at: string): AdvanceResult {
  if (!canAdvance(stages)) return { stages, advancedTo: null, changed: false };
  const sorted = [...stages].sort(byOrder);

  const inProgress = sorted.find((s) => s.state === 'IN_PROGRESS');
  if (inProgress) {
    const next = sorted.find(
      (s) => stageOrder(s.stage) > stageOrder(inProgress.stage) && s.state === 'PENDING',
    );
    const updated = sorted.map((s) => {
      if (s.stage === inProgress.stage)
        return { ...s, state: 'COMPLETE' as const, completedAt: at };
      if (next && s.stage === next.stage)
        return { ...s, state: 'IN_PROGRESS' as const, startedAt: at };
      return s;
    });
    return { stages: updated, advancedTo: next?.stage ?? null, changed: true };
  }

  const firstPending = sorted.find((s) => s.state === 'PENDING');
  if (firstPending) {
    const updated = sorted.map((s) =>
      s.stage === firstPending.stage ? { ...s, state: 'IN_PROGRESS' as const, startedAt: at } : s,
    );
    return { stages: updated, advancedTo: firstPending.stage, changed: true };
  }

  return { stages: sorted, advancedTo: null, changed: false };
}

export function computeProgress(stages: readonly StageProgress[]): ProgressInfo {
  const total = stages.length;
  const completed = stages.filter((s) => isStageDone(s.state)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return {
    completedStages: completed,
    totalStages: total,
    percent,
    currentStage: currentStage(stages),
  };
}
