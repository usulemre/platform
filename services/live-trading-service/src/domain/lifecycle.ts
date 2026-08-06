/**
 * Pure Live Trading Platform lifecycle + runtime-control rules. Deterministic, no IO, no
 * execution, no PnL/exposure calculation. These describe *whether* a governed transition
 * or runtime control is structurally permitted; the transition and the execution itself
 * happen elsewhere (Risk Engine, Workflow Engine, governance, the broker gateway — CP-5),
 * never here.
 *
 * The kill switch and emergency stop are human authorities: `canEngageKillSwitch` returns
 * true for any non-terminal deployment and is NEVER additionally gated by AI.
 */
import {
  canEmergencyStop,
  canPause,
  canRestart,
  canResume,
  canStop,
  nextStage,
  type ApprovalStatus,
  type Deployment,
  type DeploymentStage,
} from '@platform/trading-sdk';

/** The stage a deployment would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(deployment: Deployment): DeploymentStage | null {
  return nextStage(deployment.stage);
}

/** Whether the deployment's runtime may be paused. */
export function isPausable(deployment: Deployment): boolean {
  return canPause(deployment.runtime.status);
}

/** Whether the deployment's runtime may be resumed. */
export function isResumable(deployment: Deployment): boolean {
  return canResume(deployment.runtime.status);
}

/** Whether the deployment's runtime may be stopped. */
export function isStoppable(deployment: Deployment): boolean {
  return canStop(deployment.runtime.status);
}

/** Whether the deployment's runtime may be restarted (subject to re-authorization). */
export function isRestartable(deployment: Deployment): boolean {
  return canRestart(deployment.runtime.status);
}

/** Whether a rollback is applicable (a deployment that has reached production). */
export function isRollbackable(deployment: Deployment): boolean {
  return (
    deployment.stage === 'RUNNING' ||
    deployment.stage === 'PAUSED' ||
    deployment.stage === 'STOPPED'
  );
}

/** Whether an emergency stop is applicable (any non-stopped runtime; human authority). */
export function isEmergencyStoppable(deployment: Deployment): boolean {
  return canEmergencyStop(deployment.runtime.status);
}

/**
 * Whether the kill switch may be engaged. It is ALWAYS available for a non-archived
 * deployment — this is a human authority and is never additionally gated by AI.
 */
export function canEngageKillSwitch(deployment: Deployment): boolean {
  return deployment.stage !== 'ARCHIVED';
}

/** Whether a deployment is authorized for LIVE execution (mode LIVE + a valid token). */
export function isLiveAuthorized(deployment: Deployment): boolean {
  return deployment.mode === 'LIVE' && !!deployment.authorization?.valid;
}

/** Whether a deployment is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(deployment: Deployment): boolean {
  return deployment.approvals.some((approval) => approval.status === 'PENDING');
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(deployment: Deployment): ApprovalStatus {
  if (deployment.approvals.length === 0) return 'NOT_REQUESTED';
  if (deployment.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (deployment.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (deployment.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
