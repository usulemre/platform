/**
 * Deployment query model + pure query application (search / filter / sort). Data-layer
 * logic, not UI logic. Deterministic — mirrors the service's pure discovery/search so
 * both tiers behave identically.
 */
import type { Deployment, DeploymentStage } from '@platform/trading-sdk';

export type DeploymentSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface DeploymentQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: DeploymentStage | 'ALL';
  readonly tag?: string;
  readonly sortBy?: DeploymentSortField;
  readonly sortDir?: SortDir;
}

export function applyDeploymentQuery(
  data: readonly Deployment[],
  query: DeploymentQuery,
): Deployment[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((deployment) => {
    if (namespace !== 'ALL' && deployment.namespace !== namespace) return false;
    if (stage !== 'ALL' && deployment.stage !== stage) return false;
    if (tag && !deployment.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${deployment.name} ${deployment.namespace} ${deployment.family} ${deployment.owner.owner} ${deployment.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
