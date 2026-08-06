/**
 * Pure research-dependency logic. Deterministic, no IO. Backs the Research
 * Dependencies capability — no algorithms beyond ordering/graph reachability.
 */
import {
  isStageDone,
  stageOrder,
  type ResearchDependency,
  type ResearchStage,
  type StageProgress,
} from '@platform/research-sdk';

/** Dependencies that are not yet satisfied. */
export function unmetDependencies(
  deps: readonly ResearchDependency[],
): readonly ResearchDependency[] {
  return deps.filter((dependency) => dependency.status !== 'SATISFIED');
}

/** A stage is ready when every stage it depends on is COMPLETE. */
export function isStageReady(
  stage: ResearchStage,
  deps: readonly ResearchDependency[],
  stages: readonly StageProgress[],
): boolean {
  const required = deps.filter((dependency) => dependency.stage === stage);
  return required.every((dependency) => {
    const upstream = stages.find((s) => s.stage === dependency.dependsOnStage);
    return upstream ? isStageDone(upstream.state) : false;
  });
}

/**
 * Detect a cycle in the dependency edges. A well-formed lifecycle only depends
 * on earlier stages; an edge to a later-or-equal stage forms a cycle risk.
 */
export function hasCycle(deps: readonly ResearchDependency[]): boolean {
  return deps.some(
    (dependency) => stageOrder(dependency.dependsOnStage) >= stageOrder(dependency.stage),
  );
}
