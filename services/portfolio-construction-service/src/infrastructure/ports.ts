/**
 * Infrastructure INTERFACES (ports) for the portfolio-construction service. The
 * application and domain layers depend only on these abstractions; concrete adapters
 * are injected at composition time. NO implementation here: no storage, no cache, no
 * database, no broker, no optimizer, no weight/risk computation. Other subsystems
 * (Research Engine, Feature Store, Signal Engine, Backtesting Engine, Portfolio
 * module, Risk module, Validation Foundation, Workflow Engine, Configuration
 * Foundation, Event & Messaging Foundation, Market Data Platform) are reached through
 * these abstractions by reference only.
 */
import type {
  Portfolio,
  PortfolioComparison,
  PortfolioFamily,
  PortfolioTemplate,
} from '@platform/portfolio-sdk';

/* ----------------------------- read models ----------------------------- */

export interface PortfolioQueryPort {
  list(): Promise<readonly Portfolio[]>;
  getById(id: string): Promise<Portfolio | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly PortfolioFamily[]>;
}

export interface ComparisonQueryPort {
  list(): Promise<readonly PortfolioComparison[]>;
  getById(id: string): Promise<PortfolioComparison | null>;
}

export interface TemplateQueryPort {
  list(): Promise<readonly PortfolioTemplate[]>;
}

/* --------------------------- integration ports -------------------------- */

/** Market Data Platform — availability of the requested universe (ref only). */
export interface MarketDataPort {
  isUniverseAvailable(universeRef: string): Promise<boolean>;
}

/**
 * Optimizer — the boundary to the (external, elsewhere-implemented) portfolio
 * optimizer. This service NEVER optimizes and NEVER computes weights; it only
 * requests optimization and reflects the request state through this port.
 */
export interface OptimizerPort {
  requestOptimization(portfolioId: string): Promise<void>;
  cancelOptimization(portfolioId: string): Promise<void>;
}

/** Risk module — whether the portfolio cleared its risk assessment (decided elsewhere). */
export interface RiskPort {
  isRiskCleared(portfolioId: string): Promise<boolean>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a portfolio cleared its validation gate. */
export interface ValidationPort {
  isValidated(portfolioId: string): Promise<boolean>;
}

/** Workflow Engine — schedule optimization/validation/review/approval/rebalance workflows. */
export interface WorkflowPort {
  scheduleOptimization(portfolioId: string): Promise<void>;
  scheduleReview(portfolioId: string): Promise<void>;
  scheduleApproval(portfolioId: string): Promise<void>;
  scheduleRebalance(portfolioId: string): Promise<void>;
}

export interface PortfolioEvent {
  readonly id: string;
  readonly portfolioId: string;
  readonly type:
    | 'OPTIMIZATION_REQUESTED'
    | 'OPTIMIZATION_CANCELLED'
    | 'OPTIMIZATION_RETRIED'
    | 'REVIEW_REQUESTED'
    | 'APPROVAL_REQUESTED'
    | 'REBALANCE_REQUESTED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: PortfolioEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
