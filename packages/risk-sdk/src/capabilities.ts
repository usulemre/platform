/**
 * Canonical Risk Engine capabilities — the reusable governance services the engine
 * exposes over the risk lifecycle. Vocabulary + descriptors only; behaviour is
 * supplied by the service application layer and infrastructure adapters. No VaR, no
 * CVaR, no stress testing, no exposure calculation.
 */
export type RiskCapability =
  | 'PORTFOLIO_VALIDATION'
  | 'POLICY_VALIDATION'
  | 'EXPOSURE_VALIDATION'
  | 'LIMIT_VALIDATION'
  | 'APPROVAL_WORKFLOW'
  | 'RISK_REGISTRY'
  | 'RISK_HISTORY'
  | 'RISK_REPORTS'
  | 'RISK_AUDIT'
  | 'RISK_EXCEPTIONS'
  | 'RISK_OVERRIDES'
  | 'RISK_LINEAGE';

export interface RiskCapabilityDescriptor {
  readonly capability: RiskCapability;
  readonly label: string;
  readonly description: string;
}

export const RISK_CAPABILITIES: readonly RiskCapability[] = [
  'PORTFOLIO_VALIDATION',
  'POLICY_VALIDATION',
  'EXPOSURE_VALIDATION',
  'LIMIT_VALIDATION',
  'APPROVAL_WORKFLOW',
  'RISK_REGISTRY',
  'RISK_HISTORY',
  'RISK_REPORTS',
  'RISK_AUDIT',
  'RISK_EXCEPTIONS',
  'RISK_OVERRIDES',
  'RISK_LINEAGE',
];

const DESCRIPTORS: Record<RiskCapability, RiskCapabilityDescriptor> = {
  PORTFOLIO_VALIDATION: {
    capability: 'PORTFOLIO_VALIDATION',
    label: 'Portfolio validation',
    description: 'Validate a portfolio before execution (decided elsewhere).',
  },
  POLICY_VALIDATION: {
    capability: 'POLICY_VALIDATION',
    label: 'Policy validation',
    description: 'Enforce applicable risk policies over an assessment.',
  },
  EXPOSURE_VALIDATION: {
    capability: 'EXPOSURE_VALIDATION',
    label: 'Exposure validation',
    description: 'Review reported exposures against policy (values supplied, never calculated).',
  },
  LIMIT_VALIDATION: {
    capability: 'LIMIT_VALIDATION',
    label: 'Limit validation',
    description: 'Validate reported utilization against configured limits.',
  },
  APPROVAL_WORKFLOW: {
    capability: 'APPROVAL_WORKFLOW',
    label: 'Approval workflow',
    description: 'Coordinate the risk approval workflow (decided by accountable humans).',
  },
  RISK_REGISTRY: {
    capability: 'RISK_REGISTRY',
    label: 'Risk registry',
    description: 'The canonical registry of risk assessments.',
  },
  RISK_HISTORY: {
    capability: 'RISK_HISTORY',
    label: 'Risk history',
    description: 'Immutable, versioned assessment history and snapshots.',
  },
  RISK_REPORTS: {
    capability: 'RISK_REPORTS',
    label: 'Risk reports',
    description: 'References to generated risk reports (artifacts live elsewhere).',
  },
  RISK_AUDIT: {
    capability: 'RISK_AUDIT',
    label: 'Risk audit',
    description: 'The tamper-evident audit timeline of governance events.',
  },
  RISK_EXCEPTIONS: {
    capability: 'RISK_EXCEPTIONS',
    label: 'Risk exceptions',
    description: 'Raise and disposition risk exceptions.',
  },
  RISK_OVERRIDES: {
    capability: 'RISK_OVERRIDES',
    label: 'Risk overrides',
    description: 'Record time-boxed, counter-signed human overrides.',
  },
  RISK_LINEAGE: {
    capability: 'RISK_LINEAGE',
    label: 'Risk lineage',
    description: 'Provenance across signals, strategies, backtests and portfolios.',
  },
};

export function describeCapability(capability: RiskCapability): RiskCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly RiskCapabilityDescriptor[] {
  return RISK_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
