/**
 * Pure Live Trading Platform discovery/search. Deterministic, no IO. Backs the registry
 * and deployment-explorer capabilities — no ranking model, no execution, no
 * PnL/exposure calculation.
 */
import { deploymentKey, type Deployment, type DeploymentStage } from '@platform/trading-sdk';

export interface DeploymentSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: DeploymentStage | 'ALL';
  readonly tag?: string;
}

export function searchDeployments(
  deployments: readonly Deployment[],
  query: DeploymentSearch,
): Deployment[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return deployments
    .filter((deployment) => {
      if (namespace !== 'ALL' && deployment.namespace !== namespace) return false;
      if (family !== 'ALL' && deployment.family !== family) return false;
      if (stage !== 'ALL' && deployment.stage !== stage) return false;
      if (tag && !deployment.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${deployment.name} ${deployment.namespace} ${deployment.family} ${deployment.owner.owner} ${deployment.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a deployment by its canonical `namespace/family/name` key. */
export function resolveByKey(deployments: readonly Deployment[], key: string): Deployment | null {
  const needle = key.trim().toLowerCase();
  return (
    deployments.find(
      (deployment) =>
        deploymentKey(deployment.namespace, deployment.family, deployment.name) === needle,
    ) ?? null
  );
}
