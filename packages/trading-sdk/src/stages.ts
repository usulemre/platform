/**
 * The canonical live-trading deployment lifecycle — an ordered, gated progression from a
 * candidate strategy to an archived production deployment. Vocabulary + pure ordering
 * only; NO exchange/broker connectivity, NO order execution, NO REST/WebSocket/FIX. Stage
 * transitions are decided by deterministic engines, governance and accountable humans,
 * never here.
 *
 * DEFAULT execution posture is paper/shadow; a `RUNNING` live deployment is reachable
 * only through the risk and deployment approval gates plus a valid governance
 * authorization token. The kill switch is always available (never gated by this SDK).
 */
export type DeploymentStage =
  | 'CANDIDATE_STRATEGY'
  | 'DEPLOYMENT_REQUEST'
  | 'RISK_APPROVAL'
  | 'DEPLOYMENT_APPROVAL'
  | 'PRODUCTION_READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPED'
  | 'ARCHIVED';

export interface DeploymentStageDescriptor {
  readonly stage: DeploymentStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: candidate → deployment request → risk approval → deployment approval → production ready → running → paused → stopped → archived. */
export const DEPLOYMENT_STAGES: readonly DeploymentStage[] = [
  'CANDIDATE_STRATEGY',
  'DEPLOYMENT_REQUEST',
  'RISK_APPROVAL',
  'DEPLOYMENT_APPROVAL',
  'PRODUCTION_READY',
  'RUNNING',
  'PAUSED',
  'STOPPED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<DeploymentStage, DeploymentStageDescriptor> = {
  CANDIDATE_STRATEGY: {
    stage: 'CANDIDATE_STRATEGY',
    label: 'Candidate strategy',
    description: 'A validated, paper-traded strategy proposed for production.',
    gate: false,
  },
  DEPLOYMENT_REQUEST: {
    stage: 'DEPLOYMENT_REQUEST',
    label: 'Deployment request',
    description: 'A production-deployment request has been raised.',
    gate: false,
  },
  RISK_APPROVAL: {
    stage: 'RISK_APPROVAL',
    label: 'Risk approval',
    description: 'Pre-deployment risk sign-off (decided by the Risk Engine / accountable humans).',
    gate: true,
  },
  DEPLOYMENT_APPROVAL: {
    stage: 'DEPLOYMENT_APPROVAL',
    label: 'Deployment approval',
    description: 'Governance deployment sign-off producing a time-boxed authorization token.',
    gate: true,
  },
  PRODUCTION_READY: {
    stage: 'PRODUCTION_READY',
    label: 'Production ready',
    description: 'Approved and authorized; awaiting activation (paper-first by default).',
    gate: false,
  },
  RUNNING: {
    stage: 'RUNNING',
    label: 'Running',
    description: 'The deployment is active (paper/shadow unless a live token is present).',
    gate: false,
  },
  PAUSED: {
    stage: 'PAUSED',
    label: 'Paused',
    description: 'Temporarily halted; resumable by an authorized human.',
    gate: false,
  },
  STOPPED: {
    stage: 'STOPPED',
    label: 'Stopped',
    description: 'Deactivated; unwound and no longer trading.',
    gate: false,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Retired; retained for reproducibility and audit.',
    gate: false,
  },
};

export function describeStage(stage: DeploymentStage): DeploymentStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: DeploymentStage): number {
  return DEPLOYMENT_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: DeploymentStage): DeploymentStage | null {
  const index = DEPLOYMENT_STAGES.indexOf(stage);
  return index >= 0 && index < DEPLOYMENT_STAGES.length - 1 ? DEPLOYMENT_STAGES[index + 1]! : null;
}

/** Whether a deployment has reached production readiness (approved + authorized). */
export function isProductionReady(stage: DeploymentStage): boolean {
  return stageOrder(stage) >= stageOrder('PRODUCTION_READY');
}

/** Whether a deployment is terminal (archived). */
export function isArchived(stage: DeploymentStage): boolean {
  return stage === 'ARCHIVED';
}
