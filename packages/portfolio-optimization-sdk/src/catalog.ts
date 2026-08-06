/**
 * The catalog of optimization methods exposed by this SDK — descriptors linking each optimizer key
 * to its category, parameters and the inputs it consumes (signals, previous weights). Metadata ONLY
 * (the algorithms live in the sibling modules); it drives the service's registry / metadata
 * generator, the dependency graph and the researcher-facing Allocation Explorer.
 */
export type OptimizerKey =
  | 'equal_weight'
  | 'inverse_volatility'
  | 'minimum_variance'
  | 'mean_variance'
  | 'maximum_sharpe'
  | 'maximum_diversification'
  | 'risk_parity'
  | 'equal_risk_contribution'
  | 'target_volatility'
  | 'position_sizing'
  | 'portfolio_rebalancing'
  | 'cash_allocation';

export type OptimizerCategory = 'NAIVE' | 'RISK_BASED' | 'RETURN_BASED' | 'ALLOCATION';

export interface OptimizerParam {
  readonly name: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly min: number;
  readonly max: number;
  readonly integer: boolean;
}

export interface OptimizerDescriptor {
  readonly key: OptimizerKey;
  readonly label: string;
  readonly category: OptimizerCategory;
  readonly params: readonly OptimizerParam[];
  /** Whether the method uses the trading signals (position sizing / return tilts). */
  readonly usesSignals: boolean;
  /** Whether the method uses the previous weights (rebalancing / turnover). */
  readonly usesPrevious: boolean;
  /** Whether the method is iterative (reports iterations / convergence). */
  readonly iterative: boolean;
  readonly description: string;
}

const LEVEL = (
  name: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
): OptimizerParam => ({ name, label, defaultValue, min, max, integer: false });

export const OPTIMIZER_CATALOG: readonly OptimizerDescriptor[] = [
  {
    key: 'equal_weight',
    label: 'Equal Weight',
    category: 'NAIVE',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: false,
    description: 'Allocate 1/n to each asset (the 1/N benchmark).',
  },
  {
    key: 'inverse_volatility',
    label: 'Inverse Volatility',
    category: 'RISK_BASED',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: false,
    description: 'Weight inversely to volatility (naive risk balancing).',
  },
  {
    key: 'minimum_variance',
    label: 'Minimum Variance',
    category: 'RISK_BASED',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: true,
    description: 'Minimize portfolio variance subject to the constraints.',
  },
  {
    key: 'mean_variance',
    label: 'Mean-Variance (Markowitz)',
    category: 'RETURN_BASED',
    params: [LEVEL('riskAversion', 'Risk aversion (λ)', 3, 0.1, 50)],
    usesSignals: true,
    usesPrevious: false,
    iterative: true,
    description: 'Maximize μᵀw − (λ/2)·wᵀΣw (return vs variance trade-off).',
  },
  {
    key: 'maximum_sharpe',
    label: 'Maximum Sharpe',
    category: 'RETURN_BASED',
    params: [],
    usesSignals: true,
    usesPrevious: false,
    iterative: true,
    description: 'The tangency portfolio: maximize the Sharpe ratio.',
  },
  {
    key: 'maximum_diversification',
    label: 'Maximum Diversification',
    category: 'RISK_BASED',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: false,
    description: 'Maximize the diversification ratio (wᵀσ)/σ_p.',
  },
  {
    key: 'risk_parity',
    label: 'Risk Parity',
    category: 'RISK_BASED',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: true,
    description: 'Equalize each asset’s risk contribution (equivalent to equal-risk-contribution).',
  },
  {
    key: 'equal_risk_contribution',
    label: 'Equal Risk Contribution',
    category: 'RISK_BASED',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: true,
    description: 'Solve for equal fractional risk contributions across assets.',
  },
  {
    key: 'target_volatility',
    label: 'Target Volatility',
    category: 'ALLOCATION',
    params: [LEVEL('targetVol', 'Target volatility', 0.015, 0.001, 0.1)],
    usesSignals: true,
    usesPrevious: false,
    iterative: true,
    description: 'Scale a max-Sharpe base with cash to hit a target volatility.',
  },
  {
    key: 'position_sizing',
    label: 'Position Sizing',
    category: 'ALLOCATION',
    params: [],
    usesSignals: true,
    usesPrevious: false,
    iterative: false,
    description: 'Volatility-scaled, signal-directed position sizing.',
  },
  {
    key: 'portfolio_rebalancing',
    label: 'Portfolio Rebalancing',
    category: 'ALLOCATION',
    params: [],
    usesSignals: false,
    usesPrevious: true,
    iterative: false,
    description: 'Move toward a target portfolio within the turnover cap.',
  },
  {
    key: 'cash_allocation',
    label: 'Cash Allocation',
    category: 'ALLOCATION',
    params: [],
    usesSignals: false,
    usesPrevious: false,
    iterative: true,
    description: 'Risk-parity risk portfolio with an explicit cash reserve.',
  },
];

export function describeOptimizer(key: OptimizerKey): OptimizerDescriptor | undefined {
  return OPTIMIZER_CATALOG.find((optimizer) => optimizer.key === key);
}

export function optimizersInCategory(category: OptimizerCategory): readonly OptimizerDescriptor[] {
  return OPTIMIZER_CATALOG.filter((optimizer) => optimizer.category === category);
}
