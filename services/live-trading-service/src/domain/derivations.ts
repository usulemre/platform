/**
 * Pure Live Trading Platform domain derivations. Deterministic, no IO, no execution, no
 * PnL/exposure calculation. These back the running-strategies, queue, history and
 * versioning capabilities. Order/position/metric VALUES are passed through unchanged —
 * never calculated.
 */
import {
  compareVersions,
  isActiveDeployment,
  isOpenOrder,
  type Deployment,
  type DeploymentVersion,
} from '@platform/trading-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(deployment: Deployment): DeploymentVersion | null {
  return deployment.versions.reduce<DeploymentVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Deployments with an active runtime (running / paused) — the running strategies. */
export function runningStrategies(deployments: readonly Deployment[]): Deployment[] {
  return deployments.filter((deployment) => isActiveDeployment(deployment.runtime.status));
}

/** Deployments awaiting a governance approval decision. */
export function approvalQueue(deployments: readonly Deployment[]): Deployment[] {
  return deployments.filter((deployment) =>
    deployment.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

/** Stopped / archived deployments — the deployment history. */
export function deploymentHistory(deployments: readonly Deployment[]): Deployment[] {
  return deployments.filter(
    (deployment) => deployment.stage === 'STOPPED' || deployment.stage === 'ARCHIVED',
  );
}

/** Deployments whose kill switch is engaged (halted). */
export function killed(deployments: readonly Deployment[]): Deployment[] {
  return deployments.filter((deployment) => deployment.killSwitch.status === 'ENGAGED');
}

/** The count of open (non-terminal) orders in a deployment. */
export function openOrderCount(deployment: Deployment): number {
  return deployment.orders.filter((order) => isOpenOrder(order.status)).length;
}

/** The count of open positions in a deployment. */
export function openPositionCount(deployment: Deployment): number {
  return deployment.positions.filter((position) => position.open).length;
}
