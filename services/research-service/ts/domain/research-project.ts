/**
 * ResearchProject aggregate — a pure wrapper over the canonical ResearchProject
 * that exposes derived, deterministic views and immutable transitions. It embeds
 * NO quantitative algorithms and makes NO governance decision; approvals and
 * validation verdicts are recorded here, decided elsewhere (CP-5, RG-2).
 */
import type {
  ProgressInfo,
  ResearchApproval,
  ResearchMetrics,
  ResearchProject,
  ResearchReview,
  ResearchStage,
  StageProgress,
} from '@platform/research-sdk';
import {
  advance,
  canAdvance,
  computeProgress,
  currentStage,
  hasSkipViolation,
} from './lifecycle-rules';
import { unmetDependencies } from './dependencies';

const DAY_MS = 86_400_000;

export class ResearchProjectAggregate {
  constructor(private readonly project: ResearchProject) {}

  get id(): string {
    return this.project.id;
  }

  progress(): ProgressInfo {
    return computeProgress(this.project.stages);
  }

  currentStage(): ResearchStage {
    return currentStage(this.project.stages);
  }

  canAdvance(): boolean {
    return canAdvance(this.project.stages);
  }

  isConsistent(): boolean {
    return !hasSkipViolation(this.project.stages);
  }

  openObjectives(): number {
    return this.project.objectives.filter(
      (objective) => objective.status === 'OPEN' || objective.status === 'IN_PROGRESS',
    ).length;
  }

  pendingReviews(): readonly ResearchReview[] {
    return this.project.reviews.filter((review) => review.status === 'PENDING');
  }

  finalApproval(): ResearchApproval | null {
    return (
      this.project.approvals.find((approval) =>
        approval.role.toLowerCase().includes('governance'),
      ) ??
      this.project.approvals[0] ??
      null
    );
  }

  isApproved(): boolean {
    return this.project.approvals.some((approval) => approval.status === 'APPROVED');
  }

  /** Immutable advance: returns the next stages array (does not mutate). */
  advanced(at: string): {
    stages: readonly StageProgress[];
    advancedTo: ResearchStage | null;
    changed: boolean;
  } {
    return advance(this.project.stages, at);
  }

  metrics(now: string): ResearchMetrics {
    const created = Date.parse(this.project.createdAt);
    const ageDays = Number.isNaN(created)
      ? 0
      : Math.max(0, Math.floor((Date.parse(now) - created) / DAY_MS));
    return {
      openObjectives: String(this.openObjectives()),
      artifacts: String(this.project.artifacts.length),
      sessions: String(this.project.sessions.length),
      reviewsPending: String(this.pendingReviews().length),
      ageDays: `${ageDays}d`,
    };
  }

  unmetDependencyCount(): number {
    return unmetDependencies(this.project.dependencies).length;
  }
}
